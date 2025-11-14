const API_URL = "http://localhost:5114/api/Acceso/Registrarse"

function showMessage(form, message, type = 'success') {
	const existing = document.getElementById('registroMessage')
	if (existing) existing.remove()

	const div = document.createElement('div')
	div.id = 'registroMessage'
	div.setAttribute('role', 'alert')
	div.className = 'text-center px-3 py-2 rounded'
	if (type === 'success') div.classList.add('bg-green-500', 'text-white')
	else div.classList.add('bg-red-500', 'text-white')
	div.textContent = message

	form.prepend(div)

	setTimeout(() => {
		if (div.parentNode) div.remove()
	}, 3000)
}

document.addEventListener('DOMContentLoaded', () => {
	const formularioRegistro = document.getElementById('formularioRegistro')
	if (!formularioRegistro) return

	formularioRegistro.addEventListener('submit', async (e) => {
		e.preventDefault()

		const nombre = document.getElementById('nombre') ? document.getElementById('nombre').value.trim() : ''
		const email = document.getElementById('email') ? document.getElementById('email').value.trim() : ''
		const password = document.getElementById('password') ? document.getElementById('password').value : ''

		if (!nombre || !email || !password) {
			showMessage(formularioRegistro, 'Complete nombre, email y contraseña', 'error')
			return
		}

		try {
			const resp = await fetch(API_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ nombre, correo: email, contraseña: password })
			})

			if (resp.ok) {
				showMessage(formularioRegistro, 'Registro exitoso. Redirigiendo al login...', 'success')
				setTimeout(() => { window.location.href = './login.html' }, 1200)
			} else {
				let errMsg = 'No se pudo registrar'
				try {
					const body = await resp.json()
					if (body && (body.message || body.error)) errMsg = body.message || body.error
				} catch (err) { /* ignore parse error */ }
				showMessage(formularioRegistro, errMsg, 'error')
			}
		} catch (error) {
			console.error('Registro error:', error)
			showMessage(formularioRegistro, 'Error de conexión. Intente nuevamente.', 'error')
		}
	})
})