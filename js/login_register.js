// login_register.js

// Lấy các phần tử HTML từ trang đăng nhập
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginButton = document.getElementById('loginButton');
const loginMessageDiv = document.getElementById('loginMessage');
const loginLoadingMessage = document.getElementById('loginLoadingMessage');
const loginAuthContainer = document.querySelector('.auth-container');

// Lấy các phần tử HTML từ trang đăng ký
const registerEmail = document.getElementById('registerEmail');
const registerPassword = document.getElementById('registerPassword');
const registerConfirmPassword = document.getElementById('registerConfirmPassword');
const registerButton = document.getElementById('registerButton');
const registerMessageDiv = document.getElementById('registerMessage');
const registerLoadingMessage = document.getElementById('registerLoadingMessage');
const registerAuthContainer = document.querySelector('.auth-container');

// Lấy các phần tử HTML từ trang quên mật khẩu
const forgotEmail = document.getElementById('forgotEmail');
const resetPasswordButton = document.getElementById('resetPasswordButton');
const forgotMessageDiv = document.getElementById('forgotMessage');
const forgotLoadingMessage = document.getElementById('forgotLoadingMessage');
const forgotAuthContainer = document.querySelector('.auth-container');

// URL các trang tĩnh của bạn
const loginPageUrl = 'https://tddsb.blogspot.com/p/login.html';
const adminDashboardUrl = 'https://tddsb.blogspot.com/p/admin-dashboard.html';
const userDashboardUrl = 'https://tddsb.blogspot.com/p/user-dashboard.html';

// ----- Logic cho Trang Đăng Nhập -----
if (loginButton) {
    function showLoginLoading(isLoading) {
        loginLoadingMessage.style.display = isLoading ? 'block' : 'none';
        loginAuthContainer.style.opacity = isLoading ? '0.5' : '1';
        loginAuthContainer.style.pointerEvents = isLoading ? 'none' : 'auto';
    }

    loginButton.addEventListener('click', async () => {
        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();
        loginMessageDiv.textContent = '';
        loginMessageDiv.className = '';
        showLoginLoading(true);

        try {
            const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            const doc = await window.firebaseDb.collection('users').doc(user.uid).get();

            if (doc.exists) {
                const userData = doc.data();
                if (userData.status === 'blocked') {
                    loginMessageDiv.textContent = 'Tài khoản của bạn đã bị chặn.';
                    loginMessageDiv.className = 'error';
                    await window.firebaseAuth.signOut();
                } else if (userData.status === 'pending') {
                    loginMessageDiv.textContent = 'Tài khoản của bạn đang chờ duyệt.';
                    loginMessageDiv.className = 'warning';
                    await window.firebaseAuth.signOut();
                } else if (userData.status === 'active') {
                    loginMessageDiv.textContent = 'Đăng nhập thành công! Đang chuyển hướng...';
                    loginMessageDiv.className = 'success';
                    
                    const redirectUrl = (userData.role === 'admin') 
                      ? adminDashboardUrl 
                      : userDashboardUrl;
                    
                    setTimeout(() => { window.location.href = redirectUrl; }, 1500);

                } else {
                    loginMessageDiv.textContent = 'Trạng thái tài khoản không hợp lệ.';
                    loginMessageDiv.className = 'error';
                    await window.firebaseAuth.signOut();
                }
            } else {
                loginMessageDiv.textContent = 'Lỗi: Không tìm thấy thông tin tài khoản.';
                loginMessageDiv.className = 'error';
                await window.firebaseAuth.signOut();
            }
        } catch (error) {
            let displayMessage = `Lỗi: ${error.message}`;
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-login-credentials') {
                displayMessage = 'Email hoặc mật khẩu không đúng.';
            } else if (error.code === 'auth/invalid-email') {
                displayMessage = 'Định dạng email không hợp lệ.';
            } else if (error.code === 'auth/user-disabled') {
                displayMessage = 'Tài khoản này đã bị vô hiệu hóa.';
            } else if (error.code === 'auth/too-many-requests') {
                displayMessage = 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau vài phút.';
            }
            loginMessageDiv.textContent = displayMessage;
            loginMessageDiv.className = 'error';
            console.error("Lỗi đăng nhập:", error);
        } finally {
            showLoginLoading(false);
        }
    });
}

// ----- Logic cho Trang Đăng Ký -----
if (registerButton) {
    function showRegisterLoading(isLoading) {
        registerLoadingMessage.style.display = isLoading ? 'block' : 'none';
        registerAuthContainer.style.opacity = isLoading ? '0.5' : '1';
        registerAuthContainer.style.pointerEvents = isLoading ? 'none' : 'auto';
    }

    registerButton.addEventListener('click', async () => {
        const email = registerEmail.value.trim();
        const password = registerPassword.value.trim();
        const confirmPassword = registerConfirmPassword.value.trim();

        registerMessageDiv.textContent = '';
        registerMessageDiv.className = '';
        showRegisterLoading(true);

        if (password !== confirmPassword) {
            registerMessageDiv.textContent = 'Mật khẩu xác nhận không khớp.';
            registerMessageDiv.className = 'error';
            showRegisterLoading(false);
            return;
        }
        if (password.length < 6) {
            registerMessageDiv.textContent = 'Mật khẩu phải có ít nhất 6 ký tự.';
            registerMessageDiv.className = 'error';
            showRegisterLoading(false);
            return;
        }

        try {
            const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            await window.firebaseDb.collection('users').doc(user.uid).set({
                email: user.email,
                role: 'user',
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            registerMessageDiv.textContent = 'Đăng ký thành công! Tài khoản của bạn đang chờ quản trị viên duyệt.';
            registerMessageDiv.className = 'success';
            registerEmail.value = '';
            registerPassword.value = '';
            registerConfirmPassword.value = '';
            await window.firebaseAuth.signOut();
        } catch (error) {
            let displayMessage = `Lỗi: ${error.message}`;
            if (error.code === 'auth/email-already-in-use') {
                displayMessage = 'Email này đã được sử dụng.';
            } else if (error.code === 'auth/invalid-email') {
                displayMessage = 'Định dạng email không hợp lệ.';
            } else if (error.code === 'auth/weak-password') {
                displayMessage = 'Mật khẩu quá yếu. Vui lòng sử dụng ít nhất 6 ký tự.';
            }
            registerMessageDiv.textContent = displayMessage;
            registerMessageDiv.className = 'error';
            console.error("Lỗi đăng ký:", error);
        } finally {
            showRegisterLoading(false);
        }
    });
}

// ----- Logic cho Trang Quên Mật Khẩu -----
if (resetPasswordButton) {
    function showForgotLoading(isLoading) {
        forgotLoadingMessage.style.display = isLoading ? 'block' : 'none';
        forgotAuthContainer.style.opacity = isLoading ? '0.5' : '1';
        forgotAuthContainer.style.pointerEvents = isLoading ? 'none' : 'auto';
    }

    resetPasswordButton.addEventListener('click', async () => {
        const email = forgotEmail.value.trim();
        forgotMessageDiv.textContent = '';
        forgotMessageDiv.className = '';
        showForgotLoading(true);

        if (!email) {
            forgotMessageDiv.textContent = 'Vui lòng nhập địa chỉ email của bạn.';
            forgotMessageDiv.className = 'error';
            showForgotLoading(false);
            return;
        }

        try {
            await window.firebaseAuth.sendPasswordResetEmail(email);
            forgotMessageDiv.textContent = 'Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.';
            forgotMessageDiv.className = 'success';
            forgotEmail.value = '';
        } catch (error) {
            let displayMessage = `Lỗi: ${error.message}`;
            if (error.code === 'auth/user-not-found') {
                displayMessage = 'Không tìm thấy tài khoản với email này.';
            } else if (error.code === 'auth/invalid-email') {
                displayMessage = 'Định dạng email không hợp lệ.';
            }
            forgotMessageDiv.textContent = displayMessage;
            forgotMessageDiv.className = 'error';
            console.error("Lỗi đặt lại mật khẩu:", error);
        } finally {
            showForgotLoading(false);
        }
    });
}
