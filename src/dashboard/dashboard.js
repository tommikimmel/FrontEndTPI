document.addEventListener('DOMContentLoaded', () => {
	const canvas = document.getElementById('barChart')
	if (!canvas) return

	const ctx = canvas.getContext('2d')

	// Sample data: 12 months
	const labels = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
	// realistic monthly revenue values for a pharmacy (amounts in ARS)
	const values = [320000, 280000, 300000, 350000, 330000, 360000, 310000, 380000, 340000, 400000, 370000, 420000]

	// currency formatter (adjust locale/currency if you use another)
	const currencyFormatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

	function resizeCanvasAndDraw() {
		const ratio = window.devicePixelRatio || 1
		const rect = canvas.getBoundingClientRect()
		// set logical size for crisp rendering on HiDPI
		canvas.width = rect.width * ratio
		// allow up to 400px height, keep aspect reasonable
		const desiredHeight = Math.min(400, rect.width * 0.45)
		canvas.height = desiredHeight * ratio
		canvas.style.height = desiredHeight + 'px'
		ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

		drawChart()
	}

	function drawChart() {
		// clear
		ctx.clearRect(0, 0, canvas.width, canvas.height)

		// base padding; left may be increased to fit tick labels
		const basePadding = { top: 20, right: 20, bottom: 40, left: 40 }
		const w = canvas.width / (window.devicePixelRatio || 1)
		const h = canvas.height / (window.devicePixelRatio || 1)

		// compute scale and create "nice" tick step
		const rawMax = Math.max(...values)
		const ticks = 5
		const rawStep = (rawMax * 1.05) / ticks // small headroom
		const exponent = Math.floor(Math.log10(rawStep))
		const magnitude = Math.pow(10, exponent)
		const niceStep = Math.ceil(rawStep / magnitude) * magnitude
		const niceMax = niceStep * ticks

		// prepare font for measuring labels
		ctx.font = '12px Arial'
		const widestLabel = currencyFormatter.format(niceMax)
		const labelWidth = ctx.measureText(widestLabel).width

		const padding = { ...basePadding, left: Math.max(basePadding.left, Math.ceil(labelWidth) + 12) }
		const chartWidth = w - padding.left - padding.right
		const chartHeight = h - padding.top - padding.bottom

		const barGap = 8
		const barWidth = (chartWidth - (labels.length - 1) * barGap) / labels.length

		// draw axes
		ctx.strokeStyle = '#cbd5e1' // light gray
		ctx.lineWidth = 1
		ctx.beginPath()
		// y axis
		ctx.moveTo(padding.left, padding.top)
		ctx.lineTo(padding.left, padding.top + chartHeight)
		// x axis
		ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight)
		ctx.stroke()

		// y ticks and labels
		ctx.fillStyle = '#334155'
		ctx.font = '12px Arial'
		ctx.textAlign = 'right'
		ctx.textBaseline = 'middle'
		for (let i = 0; i <= ticks; i++) {
			const y = padding.top + (chartHeight * i) / ticks
			const tickValue = niceStep * (ticks - i)
			const tickLabel = currencyFormatter.format(tickValue)
			ctx.fillText(tickLabel, padding.left - 8, y)
			// no horizontal grid lines per user request
		}

		// draw bars
		for (let i = 0; i < values.length; i++) {
			const val = values[i]
			const x = padding.left + i * (barWidth + barGap)
			const barHeight = (val / niceMax) * chartHeight
			const y = padding.top + (chartHeight - barHeight)

			// bar background: use CSS variable --azul-dim if present
			const rootStyles = getComputedStyle(document.documentElement)
			const azulDim = rootStyles.getPropertyValue('--azul-dim') ? rootStyles.getPropertyValue('--azul-dim').trim() : '#446D9E'
			ctx.fillStyle = azulDim
			ctx.fillRect(x, y, barWidth, barHeight)

			// value label above bar (formatted as currency)
			ctx.fillStyle = '#0f172a'
			ctx.textAlign = 'center'
			ctx.textBaseline = 'bottom'
			ctx.font = '12px Arial'
			ctx.fillText(currencyFormatter.format(val), x + barWidth / 2, y - 6)

			// x label
			ctx.textBaseline = 'top'
			ctx.fillText(labels[i], x + barWidth / 2, padding.top + chartHeight + 6)
		}
	}


	/* --- Pie charts: Payments and Branches --- */
	function hexToRgb(hex) {
		const m = hex.replace('#','')
		const bigint = parseInt(m, 16)
		const r = (bigint >> 16) & 255
		const g = (bigint >> 8) & 255
		const b = bigint & 255
		return { r, g, b }
	}

	function getShades(baseHex, count) {
		const rgb = hexToRgb(baseHex || '#446D9E')
		const shades = []
		for (let i = 0; i < count; i++) {
			const alpha = 0.95 - (i * 0.15)
			shades.push(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`)
		}
		return shades
	}

	function generateBlueShades(baseHex, count) {
		// Create a set of blue shades by mixing the base color with white
		const baseRgb = hexToRgb(baseHex || '#446D9E')
		const shades = []
		// produce lighter shades for higher indexes
		for (let i = 0; i < count; i++) {
			// factor goes from 0 (base color) to ~0.7 (very light)
			const factor = 0.15 + (i / Math.max(1, count - 1)) * 0.7
			const r = Math.round(baseRgb.r * (1 - factor) + 255 * factor)
			const g = Math.round(baseRgb.g * (1 - factor) + 255 * factor)
			const b = Math.round(baseRgb.b * (1 - factor) + 255 * factor)
			shades.push(`rgb(${r}, ${g}, ${b})`)
		}
		// ensure first entry is exactly baseHex
		try { if (shades.length > 0) shades[0] = baseHex } catch (e) {}
		return shades
	}

	function drawPieCanvas(canvas, data, labels, legendContainer) {
		if (!canvas) return
		const ctxPie = canvas.getContext('2d')
		const ratio = window.devicePixelRatio || 1
		const rect = canvas.getBoundingClientRect()
		canvas.width = rect.width * ratio
		canvas.height = rect.height * ratio
		canvas.style.height = rect.height + 'px'
		ctxPie.setTransform(ratio,0,0,ratio,0,0)

		// compute total
		const total = data.reduce((s, v) => s + v, 0)
		let startAngle = -Math.PI / 2

		// generate blue shades derived from --azul-dim
		const rootStyles = getComputedStyle(document.documentElement)
		const base = rootStyles.getPropertyValue('--azul-dim') ? rootStyles.getPropertyValue('--azul-dim').trim() : '#446D9E'
		const colors = generateBlueShades(base, data.length)

		// clear
		ctxPie.clearRect(0,0,canvas.width, canvas.height)

		const cx = rect.width / 2
		const cy = rect.height / 2
		const radius = Math.min(rect.width, rect.height) * 0.35

		for (let i = 0; i < data.length; i++) {
			const slice = data[i]
			const angle = (slice / total) * Math.PI * 2
			const end = startAngle + angle

			ctxPie.beginPath()
			ctxPie.moveTo(cx, cy)
			ctxPie.arc(cx, cy, radius, startAngle, end)
			ctxPie.closePath()
			ctxPie.fillStyle = colors[i % colors.length]
			ctxPie.fill()

            
			startAngle = end
		}
	// hide legend container if present (user requested only charts visible)
	if (legendContainer) legendContainer.style.display = 'none'

	// create tooltip element if not exists
	let tooltip = document.getElementById('pieTooltip')
	if (!tooltip) {
		tooltip = document.createElement('div')
		tooltip.id = 'pieTooltip'
		Object.assign(tooltip.style, {
			position: 'fixed',
			pointerEvents: 'none',
			padding: '6px 8px',
			background: 'rgba(15,23,42,0.95)',
			color: 'white',
			borderRadius: '4px',
			fontSize: '12px',
			zIndex: 9999,
			display: 'none'
		})
		document.body.appendChild(tooltip)
	}

	// prepare slices with cumulative angles measured from start (-PI/2)
	let cum = 0
	const cumSlices = []
	for (let i = 0; i < data.length; i++) {
		const angle = (data[i] / total) * Math.PI * 2
		cumSlices.push({ start: cum, end: cum + angle, index: i })
		cum += angle
	}

	// event handlers for tooltip
	function onMove(e) {
		const clientX = e.clientX
		const clientY = e.clientY
		const r = canvas.getBoundingClientRect()
		const x = clientX - r.left
		const y = clientY - r.top
		const dx = x - cx
		const dy = y - cy
		const dist = Math.sqrt(dx * dx + dy * dy)
		if (dist > radius) {
			tooltip.style.display = 'none'
			return
		}
		let angle = Math.atan2(dy, dx) // -PI..PI
		// convert to 0..2PI relative to -PI/2
		let angleFromStart = angle - (-Math.PI / 2)
		if (angleFromStart < 0) angleFromStart += Math.PI * 2

		// find slice
		const found = cumSlices.find(s => angleFromStart >= s.start && angleFromStart < s.end)
		if (!found) {
			tooltip.style.display = 'none'
			return
		}
		const idx = found.index
		const val = data[idx]
		const percent = ((val / total) * 100).toFixed(1)
		tooltip.textContent = `${labels[idx]} — ${currencyFormatter.format(val)} (${percent}%)`
		tooltip.style.left = (clientX + 10) + 'px'
		tooltip.style.top = (clientY + 10) + 'px'
		tooltip.style.display = 'block'
	}

	function onOut() {
		const t = document.getElementById('pieTooltip')
		if (t) t.style.display = 'none'
	}

	canvas.removeEventListener('mousemove', canvas._pieOnMove || (() => {}))
	canvas.removeEventListener('mouseout', canvas._pieOnOut || (() => {}))
	canvas._pieOnMove = onMove
	canvas._pieOnOut = onOut
	canvas.addEventListener('mousemove', onMove)
	canvas.addEventListener('mouseout', onOut)
	}

	// sample data for pies (updated to requested sizes)
	const paymentsLabels = ['Efectivo','Tarjeta Crédito','Tarjeta Débito','Transferencia','Mercado Pago','QR','Cheque','Cuotas','GiftCard','Otro']
	const paymentsData = [650000, 980000, 720000, 260000, 430000, 210000, 90000, 180000, 60000, 40000]

	const branchesLabels = ['Sucursal 1','Sucursal 2','Sucursal 3','Sucursal 4','Sucursal 5','Sucursal 6','Sucursal 7','Sucursal 8','Sucursal 9','Sucursal 10','Sucursal 11','Sucursal 12']
	const branchesData = [420000, 360000, 390000, 310000, 450000, 370000, 340000, 410000, 330000, 380000, 300000, 440000]

	// draw pies initially
	const piePaymentsCanvas = document.getElementById('piePayments')
	const pieBranchesCanvas = document.getElementById('pieBranches')
	const legendPayments = document.getElementById('legendPayments')
	const legendBranches = document.getElementById('legendBranches')
	drawPieCanvas(piePaymentsCanvas, paymentsData, paymentsLabels, legendPayments)
	drawPieCanvas(pieBranchesCanvas, branchesData, branchesLabels, legendBranches)

	// redraw pies on resize
	window.addEventListener('resize', () => {
		if (window._pieResizeRAF) cancelAnimationFrame(window._pieResizeRAF)
		window._pieResizeRAF = requestAnimationFrame(() => {
			drawPieCanvas(piePaymentsCanvas, paymentsData, paymentsLabels, legendPayments)
			drawPieCanvas(pieBranchesCanvas, branchesData, branchesLabels, legendBranches)
		})
	})

	window.addEventListener('resize', () => {
		// throttle using rAF
		if (window._dashboardResizeRAF) cancelAnimationFrame(window._dashboardResizeRAF)
		window._dashboardResizeRAF = requestAnimationFrame(resizeCanvasAndDraw)
	})

	// initial draw
	resizeCanvasAndDraw()
})

