// user_dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    const userDashboardLogoutButton = document.getElementById('userDashboardLogoutButton');
    const userDashboardUserEmail = document.getElementById('userDashboardUserEmail');
    const userDashboardUserRole = document.getElementById('userDashboardUserRole');
    const userDashboardUserStatus = document.getElementById('userDashboardUserStatus');
    const userLogoutLink = document.getElementById('userLogoutLink');

    const updateProfileForm = document.getElementById('update-profile-form');
    const userNameInput = document.getElementById('user-name');
    const changePasswordForm = document.getElementById('change-password-form');
    const oldPasswordInput = document.getElementById('old-password');
    const newPasswordInput = document.getElementById('new-password');
    const sidebarUserName = document.getElementById('sidebar-user-name');

    const userDashboardUrl = 'https://tddsb.blogspot.com/p/user-dashboard.html';
    const loginPageUrl = 'https://tddsb.blogspot.com/p/login.html';
    
    if (typeof firebase === 'undefined' || typeof firebase.auth === 'undefined') {
        return;
    }

    window.firebaseAuth = firebase.auth();
    window.firebaseDb = firebase.firestore();

    window.firebaseAuth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = loginPageUrl;
        } else {
            try {
                const doc = await window.firebaseDb.collection('users').doc(user.uid).get();
                if (doc.exists) {
                    const userData = doc.data();
                    if (userData.status === 'active' && userData.role === 'user') {
                        // Cập nhật thông tin người dùng
                        if (userDashboardUserEmail) userDashboardUserEmail.textContent = `Email: ${user.email}`;
                        if (userDashboardUserRole) userDashboardUserRole.textContent = `Vai trò: ${userData.role}`;
                        if (userDashboardUserStatus) userDashboardUserStatus.textContent = `Trạng thái: ${userData.status}`;
                        
                        if (userNameInput && userData.name) {
                            userNameInput.value = userData.name;
                        }
                        if (sidebarUserName && userData.name) {
                            sidebarUserName.textContent = userData.name;
                        } else if (sidebarUserName) {
                            sidebarUserName.textContent = user.email;
                        }
                    } else {
                        await window.firebaseAuth.signOut();
                        window.location.href = loginPageUrl;
                    }
                } else {
                    await window.firebaseAuth.signOut();
                    window.location.href = loginPageUrl;
                }
            } catch (error) {
                await window.firebaseAuth.signOut();
                window.location.href = loginPageUrl;
            }
        }
    });

    async function handleUpdateProfile(event) {
        event.preventDefault();
        const user = window.firebaseAuth.currentUser;
        if (user) {
            const newName = userNameInput.value;
            try {
                await window.firebaseDb.collection('users').doc(user.uid).update({
                    name: newName
                });
                alert('Cập nhật thông tin thành công!');
                if (sidebarUserName) {
                    sidebarUserName.textContent = newName;
                }
            } catch (error) {
                alert('Lỗi: Không thể cập nhật thông tin. Vui lòng thử lại.');
            }
        }
    }

    async function handleChangePassword(event) {
        event.preventDefault();
        const user = window.firebaseAuth.currentUser;
        if (!user) {
            alert('Lỗi: Không tìm thấy người dùng. Vui lòng đăng nhập lại.');
            return;
        }

        const oldPassword = oldPasswordInput.value;
        const newPassword = newPasswordInput.value;

        if (newPassword.length < 6) {
            alert('Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }
        
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, oldPassword);

        try {
            await user.reauthenticateWithCredential(credential);
            await user.updatePassword(newPassword);
            alert('Đổi mật khẩu thành công!');
            changePasswordForm.reset();
        } catch (error) {
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-login-credentials') {
                 alert('Mật khẩu cũ không đúng. Vui lòng nhập lại.');
            } else if (error.code === 'auth/requires-recent-login') {
                alert('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để đổi mật khẩu.');
                await window.firebaseAuth.signOut();
            } else {
                 alert(`Lỗi: Không thể đổi mật khẩu. ${error.message}`);
            }
        }
    }

    const performUserLogout = async () => {
        try {
            await window.firebaseAuth.signOut();
            window.location.href = loginPageUrl;
        } catch (error) {
            alert('Lỗi khi đăng xuất. Vui lòng thử lại.');
        }
    };

    if (userDashboardLogoutButton) userDashboardLogoutButton.addEventListener('click', performUserLogout);
    if (userLogoutLink) userLogoutLink.addEventListener('click', performUserLogout);
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', handleUpdateProfile);
    }
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }
});
