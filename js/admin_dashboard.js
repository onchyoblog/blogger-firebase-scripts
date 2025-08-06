// admin_dashboard.js

const dashboardLogoutButton = document.getElementById('dashboardLogoutButton');
const dashboardUserEmail = document.getElementById('dashboardUserEmail');
const dashboardUserRole = document.getElementById('dashboardUserRole');
const dashboardUserStatus = document.getElementById('dashboardUserStatus');
const dashboardLogoutLink = document.getElementById('dashboardLogoutLink');
const userManagementCard = document.getElementById('userManagementCard');
const userListTbody = document.getElementById('userListTbody');
const userListTable = document.getElementById('userListTable');
const userListLoading = document.getElementById('userListLoading');
const userListError = document.getElementById('userListError');
const refreshUsersBtn = document.getElementById('refreshUsersBtn');

const loginPageUrl = 'https://tddsb.blogspot.com/p/login.html';
const userDashboardUrl = 'https://tddsb.blogspot.com/p/user-dashboard.html';

let cachedUsers = [];

// Hàm tải danh sách người dùng và hiển thị lên bảng
async function fetchUsers() {
    userListLoading.style.display = 'block';
    userListTable.style.display = 'none';
    userListError.style.display = 'none';
    userListTbody.innerHTML = '';

    try {
        const snapshot = await window.firebaseDb.collection('users').get();
        cachedUsers = [];
        if (!snapshot.empty) {
            snapshot.forEach(doc => {
                cachedUsers.push({ id: doc.id, ...doc.data() });
            });
            renderUserTable(cachedUsers);
        } else {
            userListTbody.innerHTML = '<tr><td colspan="4" class="text-center">Không có người dùng nào.</td></tr>';
            userListTable.style.display = 'table';
        }
    } catch (error) {
        console.error("Lỗi khi tải danh sách người dùng:", error);
        userListError.textContent = 'Không thể tải danh sách người dùng. Vui lòng kiểm tra kết nối.';
        userListError.style.display = 'block';
    } finally {
        userListLoading.style.display = 'none';
    }
}

// Hàm render dữ liệu vào bảng
function renderUserTable(users) {
    userListTbody.innerHTML = '';
    const currentUser = window.firebaseAuth.currentUser;
    users.forEach(user => {
        if (user.id === currentUser.uid) return; // Không hiển thị admin đang đăng nhập

        const row = document.createElement('tr');
        
        const statusDisplay = {
            'active': '<span class="badge bg-success">Active</span>',
            'pending': '<span class="badge bg-warning">Pending</span>',
            'blocked': '<span class="badge bg-danger">Blocked</span>'
        }[user.status] || `<span class="badge bg-secondary">${user.status}</span>`;

        row.innerHTML = `
            <td>${user.email}</td>
            <td>
                <select class="form-control form-control-sm user-role-select" data-id="${user.id}">
                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
            </td>
            <td>${statusDisplay}</td>
            <td class="action-buttons">
                ${user.status === 'pending' ? `<button class="btn btn-success btn-sm activate-btn" data-id="${user.id}">Kích hoạt</button>` : ''}
                ${user.status === 'blocked' ? `<button class="btn btn-info btn-sm unblock-btn" data-id="${user.id}">Bỏ chặn</button>` : ''}
                ${user.status === 'active' ? `<button class="btn btn-warning btn-sm block-btn" data-id="${user.id}">Chặn</button>` : ''}
                <button class="btn btn-danger btn-sm delete-btn" data-id="${user.id}">Xóa</button>
            </td>
        `;
        userListTbody.appendChild(row);
    });
    userListTable.style.display = 'table';
}

// Hàm cập nhật vai trò người dùng
async function updateRole(userId, newRole) {
    if (confirm(`Bạn có chắc chắn muốn thay đổi vai trò của người dùng này thành ${newRole}?`)) {
        try {
            await window.firebaseDb.collection('users').doc(userId).update({
                role: newRole
            });
            alert('Cập nhật vai trò thành công!');
            fetchUsers();
        } catch (error) {
            console.error("Lỗi khi cập nhật vai trò:", error);
            alert('Lỗi: Không thể cập nhật vai trò người dùng.');
        }
    }
}

// Hàm cập nhật trạng thái người dùng
async function updateStatus(userId, newStatus) {
    try {
        await window.firebaseDb.collection('users').doc(userId).update({
            status: newStatus
        });
        alert('Cập nhật trạng thái thành công!');
        fetchUsers();
    } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái:", error);
        alert('Lỗi: Không thể cập nhật trạng thái người dùng.');
    }
}

// HÀM XỬ LÝ XÓA TÀI KHOẢN
async function deleteUser(userId) {
    if (confirm("Bạn có chắc chắn muốn xóa tài khoản này không? Thao tác này không thể hoàn tác.")) {
        try {
            // Hiển thị thông báo đang tải
            userListLoading.style.display = 'block';
            await window.firebaseDb.collection('users').doc(userId).delete();
            alert('Tài khoản đã được xóa thành công!');
            fetchUsers();
        } catch (error) {
            console.error("Lỗi khi xóa tài khoản:", error);
            alert('Lỗi: Không thể xóa tài khoản người dùng. Vui lòng kiểm tra quyền.');
        } finally {
            userListLoading.style.display = 'none';
        }
    }
}

// Lắng nghe các sự kiện click và thay đổi trên bảng
userListTbody.addEventListener('click', (e) => {
    const target = e.target;
    const userId = target.getAttribute('data-id');

    if (target.classList.contains('activate-btn')) {
        updateStatus(userId, 'active');
    } else if (target.classList.contains('block-btn')) {
        updateStatus(userId, 'blocked');
    } else if (target.classList.contains('unblock-btn')) {
        updateStatus(userId, 'active');
    } else if (target.classList.contains('delete-btn')) {
        deleteUser(userId);
    }
});

userListTbody.addEventListener('change', (e) => {
    const target = e.target;
    if (target.classList.contains('user-role-select')) {
        const userId = target.getAttribute('data-id');
        const newRole = target.value;
        updateRole(userId, newRole);
    }
});

refreshUsersBtn.addEventListener('click', fetchUsers);

window.firebaseAuth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = loginPageUrl;
    } else {
        try {
            const doc = await window.firebaseDb.collection('users').doc(user.uid).get();
            if (doc.exists) {
                const userData = doc.data();
                if (userData.status === 'active' && userData.role === 'admin') {
                    dashboardUserEmail.textContent = `Email: ${user.email}`;
                    dashboardUserRole.textContent = `Vai trò: ${userData.role}`;
                    dashboardUserStatus.textContent = `Trạng thái: ${userData.status}`;
                    userManagementCard.style.display = 'block';
                    fetchUsers();
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

const performLogout = async () => {
    try {
        await window.firebaseAuth.signOut();
        window.location.href = loginPageUrl;
    } catch (error) {
        console.error("Lỗi đăng xuất:", error);
        alert('Lỗi khi đăng xuất. Vui lòng thử lại.');
    }
};

dashboardLogoutButton.addEventListener('click', performLogout);
dashboardLogoutLink.addEventListener('click', performLogout);
