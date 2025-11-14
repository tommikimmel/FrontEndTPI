const API_URL = "http://localhost:5114/api/Acceso/Login"

function showMessage(form, message, type = 'success') {
    const existing = document.getElementById('loginMessage')
    if (existing) existing.remove()

    const div = document.createElement('div')
    div.id = 'loginMessage'
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
    const formularioLogin = document.getElementById('formularioLogin')
    if (!formularioLogin) return

    formularioLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim()
        const password = document.getElementById('password').value

        if (!email || !password) {
            showMessage(formularioLogin, 'Por favor complete email y contraseña', 'error')
            return
        }

        try {
            const resp = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: email, contraseña: password })
            })

            if (resp.ok) {
                let data = null
                try { data = await resp.json() } catch (err) { }

                showMessage(formularioLogin, 'Has iniciado sesión', 'success')

                if (data && data.token) {
                    try { localStorage.setItem('token', data.token) } catch (e) { /* ignore storage errors */ }
                }

                //CAMBIAR PAGINA A LA DEL DASHBOARD CUANDO ESTE FINALIZADA
                setTimeout(() => { window.location.href = '../dashboard/dashboard.html' }, 1000)
            } else {
                let errMsg = 'Credenciales inválidas'
                try {
                    const errBody = await resp.json()
                    if (errBody && (errBody.message || errBody.error)) errMsg = errBody.message || errBody.error
                } catch (err) { /* ignore */ }
                showMessage(formularioLogin, errMsg, 'error')
            }
        } catch (error) {
            console.error('Login error:', error)
            showMessage(formularioLogin, 'Error de conexión. Intente nuevamente.', 'error')
        }
    })
})