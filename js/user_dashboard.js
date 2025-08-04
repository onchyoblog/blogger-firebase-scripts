// user_dashboard.js

const userDashboardLogoutButton = document.getElementById('userDashboardLogoutButton');
const userDashboardUserEmail = document.getElementById('userDashboardUserEmail');
const userDashboardUserRole = document.getElementById('userDashboardUserRole');
const userDashboardUserStatus = document.getElementById('userDashboardUserStatus');
const userLogoutLink = document.getElementById('userLogoutLink');

const userDashboardUrl = 'https://tddsb.blogspot.com/p/user-dashboard.html';
const loginPageUrl = 'https://tddsb.blogspot.com/p/login.html';
const adminDashboardUrl = 'https://tddsb.blogspot.com/p/admin-dashboard.html';

window.firebaseAuth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = loginPageUrl;
    } else {
        try {
            const doc = await window.firebaseDb.collection('users').doc(user.uid).get();
            if (doc.exists) {
                const userData = doc.data();
                // Chỉ cho phép user có vai trò 'user' và trạng thái 'active' truy cập
                if (userData.status === 'active' && userData.role === 'user') {
                    userDashboardUserEmail.textContent = `Email: ${user.email}`;
                    userDashboardUserRole.textContent = `Vai trò: ${userData.role}`;
                    userDashboardUserStatus.textContent = `Trạng thái: ${userData.status}`;
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
