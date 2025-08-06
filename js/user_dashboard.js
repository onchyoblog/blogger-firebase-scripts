// user_dashboard.js

const userDashboardLogoutButton = document.getElementById('userDashboardLogoutButton');
const userDashboardUserEmail = document.getElementById('userDashboardUserEmail');
const userDashboardUserRole = document.getElementById('userDashboardUserRole');
const userDashboardUserStatus = document.getElementById('userDashboardUserStatus');
const userLogoutLink = document.getElementById('userLogoutLink');

// Biến cho các phần tử mới
const updateProfileForm = document.getElementById('update-profile-form');
const userNameInput = document.getElementById('user-name');
const changePasswordForm = document.getElementById('change-password-form');
const newPasswordInput = document.getElementById('new-password');

// Thêm biến cho tên người dùng trên sidebar
const sidebarUserName = document.getElementById('sidebar-user-name');

const userDashboardUrl = 'https://tddsb.blogspot.com/p/user-dashboard.html';
const loginPageUrl = 'https://tddsb.blogspot.com/p/login.html';
const adminDashboardUrl = 'https://tddsb.blogspot.com/p/admin-dashboard.html';

// Lắng nghe sự thay đổi trạng thái đăng nhập
window.firebaseAuth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = loginPageUrl;
    } else {
        try {
            const doc = await window.firebaseDb.collection('users').doc(user.uid).get();
            if (doc.exists) {
                const userData = doc.data();
                if (userData.status === 'active' && userData.role === 'user') {
                    userDashboardUserEmail.textContent = `Email: ${user.email}`;
                    userDashboardUserRole.textContent = `Vai trò: ${userData.role}`;
                    userDashboardUserStatus.textContent = `Trạng thái: ${userData.status}`;
                    
                    // Thêm phần hiển thị tên người dùng hiện tại
                    if (userNameInput && userData.name) {
                        userNameInput.value = userData.name;
                    }

                    // Cập nhật tên người dùng trên sidebar
                    if (sidebarUserName && userData.name) {
                        sidebarUserName.textContent = userData.name;
                    } else if (sidebarUserName) {
                        // Nếu không có tên, hiển thị email
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
            console.error("Lỗi khi tải dữ liệu người dùng cho dashboard:", error);
            await window.firebaseAuth.signOut();
            window.location.href = loginPageUrl;
        }
    }
});

// Hàm xử lý cập nhật thông tin
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
        } catch (error) {
            console.error("Lỗi khi cập nhật thông tin:", error);
            alert('Lỗi: Không thể cập nhật thông tin. Vui lòng thử lại.');
        }
    }
}

// Hàm xử lý đổi mật khẩu
async function handleChangePassword(event) {
    event.preventDefault();
    const user = window.firebaseAuth.currentUser;
    if (user) {
        const newPassword = newPasswordInput.value;
        if (newPassword.length >= 6) {
            try {
                await user.updatePassword(newPassword);
                alert('Đổi mật khẩu thành công!');
                changePasswordForm.reset();
            } catch (error) {
                console.error("Lỗi khi đổi mật khẩu:", error);
                alert(`Lỗi: Không thể đổi mật khẩu. ${error.message}`);
            }
        } else {
            alert('Mật khẩu phải có ít nhất 6 ký tự.');
        }
    }
}

const performUserLogout = async () => {
    try {
        await window.firebaseAuth.signOut();
        window.location.href = loginPageUrl;
    } catch (error) {
        console.error("Lỗi đăng xuất:", error);
        alert('Lỗi khi đăng xuất. Vui lòng thử lại.');
    }
};

userDashboardLogoutButton.addEventListener('click', performUserLogout);
userLogoutLink.addEventListener('click', performUserLogout);

// Thêm sự kiện lắng nghe cho form cập nhật thông tin và đổi mật khẩu
if (updateProfileForm) {
    updateProfileForm.addEventListener('submit', handleUpdateProfile);
}
if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', handleChangePassword);
}
