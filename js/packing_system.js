// packing_system.js

// URL của Web App Google Apps Script của bạn
// THAY THẾ BẰNG URL WEB APP CỦA BẠN SAU KHI TRIỂN KHAI APPS SCRIPT Ở BƯỚC TIẾP THEO
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwqtttoWj4Uk5C8XQdAxFIQ5Bh06LLkj333vOy60_mvlyo6vC1wG2MIyuGoknDPouqy/exec'; 

// Mảng để lưu trữ dữ liệu đóng gói và lịch sử số dư (hiện tại là tạm thời trong bộ nhớ)
let inventory = [];
let remainingKgHistory = [];

// Lấy các phần tử DOM cần thiết
const inventoryForm = document.getElementById('inventoryForm');
const inventoryModal = $('#inventoryModal'); // Sử dụng jQuery để dễ dàng thao tác với modal
const productNameInput = document.getElementById('productName');
const supplierSelect = document.getElementById('supplierSelect');
const newSupplierInput = document.getElementById('newSupplierInput');
const addNewSupplierButton = document.getElementById('addNewSupplierButton');
const packagingTypeSelect = document.getElementById('packagingType');
const quantityInput = document.getElementById('quantity');
const weightPerBoxSelect = document.getElementById('weightPerBox');
const remainingKgInput = document.getElementById('remainingKg');
const remainingKgHelp = document.getElementById('remainingKgHelp');
const previousRemainingKgSelect = document.getElementById('previousRemainingKg');
const oldRemainingKgItemIdInput = document.getElementById('oldRemainingKgItemId');
const usedRemainingKgAmountInput = document.getElementById('usedRemainingKgAmount');
const entryDateInput = document.getElementById('entryDate');
const submitButton = document.getElementById('submitButton');
const editingItemIdInput = document.getElementById('editingItemId');

const inventoryList = document.getElementById('inventoryList');
const noDataMessage = document.getElementById('noDataMessage');
const monthlyTotalKgElement = document.getElementById('monthlyTotalKg');
const dailyRemainingKgReportTable = document.getElementById('dailyRemainingKgReport');
const noDailyReportMessage = document.getElementById('noDailyReportMessage');
const remainingKgHistoryList = document.getElementById('remainingKgHistoryList');
const noHistoryMessage = document.getElementById('noHistoryMessage');

const inventoryManagementSection = document.getElementById('inventory-management');
const inventoryReportSection = document.getElementById('inventory-report');
const navLinks = document.querySelectorAll('.nav-sidebar .nav-link');
const contentHeaderTitle = document.getElementById('contentHeaderTitle');
const breadcrumbActive = document.getElementById('breadcrumbActive');

// Đối tượng chứa các tùy chọn trọng lượng theo loại đóng gói
const packagingWeights = {
    'Đóng thùng': [17, 20],
    'Đóng Can': [20, 25],
    'Đóng Phi': [170, 175]
};

/**
 * Hàm gửi dữ liệu đóng gói lên Google Apps Script.
 * Đây là hàm thay thế cho saveAllData() của localStorage.
 * @param {Object} data - Dữ liệu đóng gói để gửi.
 */
async function sendPackingDataToAppsScript(data) {
    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Quan trọng cho Apps Script doPost
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.success) {
            alert('Dữ liệu đóng gói đã được lưu thành công vào Google Sheet!');
            // Sau khi lưu thành công, bạn có thể muốn tải lại dữ liệu từ sheet
            // hoặc thêm mục mới vào mảng inventory cục bộ nếu không muốn tải lại toàn bộ.
            // Hiện tại, chúng ta sẽ chỉ hiển thị thông báo.
        } else {
            alert(`Lỗi khi lưu dữ liệu: ${result.message}`);
            console.error('Apps Script Error:', result.message);
        }
    } catch (error) {
        console.error('Lỗi kết nối đến Google Apps Script:', error);
        alert('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
    }
}

/**
 * Hàm tải dữ liệu đóng gói từ backend (hiện tại không có backend, chỉ là placeholder).
 * Sẽ cần được cập nhật để gọi Google Apps Script doGet.
 */
function loadAllData() {
    // Đây là placeholder. Trong tương lai, bạn sẽ gọi Apps Script doGet ở đây
    // để tải dữ liệu thực tế từ Google Sheet.
    // Ví dụ: inventory = await fetchInventoryFromAppsScript();
    // Hiện tại, dữ liệu sẽ trống khi tải lại trang.
    inventory = []; 
    remainingKgHistory = [];
}

/**
 * Hàm hiển thị dữ liệu đóng gói ra bảng (hiện tại chỉ hiển thị dữ liệu trong bộ nhớ).
 */
function renderInventory() {
    inventoryList.innerHTML = '';
    if (inventory.length === 0) {
        noDataMessage.classList.remove('hidden');
    } else {
        noDataMessage.classList.add('hidden');
        inventory.forEach((item) => {
            const row = document.createElement('tr');
            row.classList.add('inventory-item');
            row.innerHTML = `
                <td>${item.productName}</td>
                <td>${item.packagingType}</td>
                <td>${item.supplier}</td>
                <td>${item.quantity}</td>
                <td>${item.weightPerBox} kg</td>
                <td>${item.remainingKg.toFixed(2)} kg</td>
                <td>${item.totalKg.toFixed(2)} kg</td>
                <td>${item.entryDate}</td>
                <td>
                    <button onclick="editInventoryItem('${item.id}')" class="btn btn-info btn-sm mr-1">
                        <i class="fas fa-edit"></i> Sửa
                    </button>
                    <button onclick="deleteInventoryItem('${item.id}')" class="btn btn-danger btn-sm">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </td>
            `;
            inventoryList.appendChild(row);
        });
    }
}

/**
 * Hàm xóa một mục đóng gói khỏi danh sách (hiện tại chỉ xóa trong bộ nhớ).
 * Sẽ cần được cập nhật để gọi Google Apps Script doDelete.
 * @param {string} id - ID của mục cần xóa.
 */
function deleteInventoryItem(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa mục này không?")) {
        return;
    }
    inventory = inventory.filter(item => item.id !== id);
    remainingKgHistory = remainingKgHistory.filter(h => h.sourceItemId !== id && h.targetItemId !== id);
    
    // sendDeleteRequestToAppsScript(id); // Cần thêm hàm này để gửi yêu cầu xóa lên Apps Script
    
    renderInventory();
    generateMonthlyReport();
    generateDailyRemainingKgReport();
    generateRemainingKgHistoryReport();
    cancelEdit();
}

/**
 * Cập nhật các tùy chọn trọng lượng (kg) dựa trên loại đóng gói được chọn.
 */
function updateWeightOptions() {
    const selectedType = packagingTypeSelect.value;
    const weights = packagingWeights[selectedType] || [];
    
    weightPerBoxSelect.innerHTML = '';
    weights.forEach(weight => {
        const option = document.createElement('option');
        option.value = weight;
        option.textContent = `${weight} kg`;
        weightPerBoxSelect.appendChild(option);
    });
}

// Lắng nghe sự kiện thay đổi của dropdown Loại đóng gói
packagingTypeSelect.addEventListener('change', function() {
    updateWeightOptions();
    populatePreviousRemainingKgDropdown();
});

/**
 * Hàm điền dữ liệu từ các sản phẩm có dư kg vào dropdown, có lọc theo loại đóng gói.
 * Hiện tại chỉ hoạt động trên dữ liệu trong bộ nhớ.
 */
function populatePreviousRemainingKgDropdown() {
    const editingId = editingItemIdInput.value;
    const selectedPackagingType = packagingTypeSelect.value;
    
    previousRemainingKgSelect.innerHTML = '<option value="">-- Chọn sản phẩm --</option>';

    const itemsWithRemainingKg = inventory.filter(item => 
        item.remainingKg > 0 && 
        item.id !== editingId &&
        item.packagingType === selectedPackagingType
    );
    
    itemsWithRemainingKg.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.productName} (${item.remainingKg.toFixed(2)} kg)`;
        previousRemainingKgSelect.appendChild(option);
    });
}

/**
 * Hàm điền dữ liệu từ các sản phẩm đã có vào dropdown Nhà cung cấp (hiện tại chỉ hoạt động trên dữ liệu trong bộ nhớ).
 */
function populateSupplierDropdown() {
    const suppliers = new Set(inventory.map(item => item.supplier));
    const sortedSuppliers = Array.from(suppliers).sort();
    
    supplierSelect.innerHTML = '<option value="">-- Chọn nhà cung cấp --</option>';

    sortedSuppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier;
        option.textContent = supplier;
        supplierSelect.appendChild(option);
    });
}

// Lắng nghe sự kiện click vào nút "Thêm nhà cung cấp mới"
addNewSupplierButton.addEventListener('click', function() {
    newSupplierInput.classList.toggle('hidden');
    if (!newSupplierInput.classList.contains('hidden')) {
        newSupplierInput.focus();
        supplierSelect.removeAttribute('required');
        newSupplierInput.setAttribute('required', 'required');
    } else {
        newSupplierInput.value = '';
        newSupplierInput.removeAttribute('required');
        supplierSelect.setAttribute('required', 'required');
    }
});

/**
 * Lắng nghe sự kiện thay đổi của dropdown để tự động điền Dư Kg và lưu giá trị cũ.
 */
previousRemainingKgSelect.addEventListener('change', function() {
    const selectedItemId = this.value;
    if (selectedItemId) {
        const selectedItem = inventory.find(item => item.id === selectedItemId);
        if (selectedItem) {
            oldRemainingKgItemIdInput.value = selectedItemId; 
            usedRemainingKgAmountInput.value = selectedItem.remainingKg;
            remainingKgHelp.textContent = `Số dư cũ (${selectedItem.remainingKg.toFixed(2)} kg) từ sản phẩm này sẽ được tận dụng.`;
            remainingKgHelp.classList.remove('hidden');
        }
    } else {
        oldRemainingKgItemIdInput.value = '';
        usedRemainingKgAmountInput.value = '';
        remainingKgHelp.classList.add('hidden');
    }
});

/**
 * Hàm xử lý khi gửi form nhập liệu (thêm mới hoặc cập nhật).
 * Sẽ gửi dữ liệu đến Google Apps Script.
 */
inventoryForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const productName = productNameInput.value.trim();
    let supplier;
    if (newSupplierInput.classList.contains('hidden')) {
        supplier = supplierSelect.value;
    } else {
        supplier = newSupplierInput.value.trim();
    }

    const packagingType = packagingTypeSelect.value;
    const quantity = parseInt(quantityInput.value);
    const weightPerBox = parseInt(weightPerBoxSelect.value);
    const remainingKgFromInput = parseFloat(remainingKgInput.value) || 0;
    const entryDate = entryDateInput.value;

    if (!productName || !supplier || isNaN(quantity) || quantity < 0 || isNaN(weightPerBox) || !entryDate || !packagingType) {
        alert("Vui lòng nhập đầy đủ và hợp lệ các trường bắt buộc.");
        return;
    }

    const totalKg = quantity * weightPerBox;
    const editingId = editingItemIdInput.value;
    const oldRemainingKgItemId = oldRemainingKgItemIdInput.value;
    const usedRemainingKgAmount = parseFloat(usedRemainingKgAmountInput.value) || 0;
    const finalRemainingKg = remainingKgFromInput;

    const newItemData = {
        id: editingId || (Date.now().toString() + Math.random().toString(36).substring(2, 9)), // Tạo ID nếu là thêm mới
        productName: productName,
        supplier: supplier,
        packagingType: packagingType,
        quantity: quantity,
        weightPerBox: weightPerBox,
        remainingKg: finalRemainingKg,
        totalKg: totalKg,
        entryDate: entryDate
    };

    // Gửi dữ liệu đến Google Apps Script
    await sendPackingDataToAppsScript(newItemData);

    // Cập nhật dữ liệu cục bộ (chỉ để hiển thị tạm thời, không lưu trữ lâu dài)
    if (editingId) {
        const itemIndex = inventory.findIndex(item => item.id === editingId);
        if (itemIndex !== -1) {
            inventory[itemIndex] = newItemData;
        }
    } else {
        inventory.push(newItemData);
    }

    // Xử lý lịch sử dư kg (vẫn là cục bộ)
    if (oldRemainingKgItemId) {
        const sourceItemIndex = inventory.findIndex(item => item.id === oldRemainingKgItemId);
        if (sourceItemIndex !== -1) {
            inventory[sourceItemIndex].remainingKg = 0; // Đặt số dư cũ về 0 trong bộ nhớ
        }
        remainingKgHistory.push({
            sourceItemId: oldRemainingKgItemId,
            targetItemId: newItemData.id,
            amountUsed: usedRemainingKgAmount,
            dateUsed: entryDate
        });
    }

    inventoryModal.modal('hide');
    renderInventory(); // Render lại bảng với dữ liệu cục bộ
    populateSupplierDropdown();
    populatePreviousRemainingKgDropdown();
    generateMonthlyReport();
    generateDailyRemainingKgReport();
    generateRemainingKgHistoryReport();
    cancelEdit(); // Đặt lại form
});

/**
 * Hàm điền dữ liệu vào form để chỉnh sửa và hiển thị modal (hiện tại chỉ hoạt động trên dữ liệu trong bộ nhớ).
 * @param {string} id - ID của mục cần chỉnh sửa.
 */
function editInventoryItem(id) {
    const itemToEdit = inventory.find(item => item.id === id);
    if (itemToEdit) {
        productNameInput.value = itemToEdit.productName;
        packagingTypeSelect.value = itemToEdit.packagingType;
        updateWeightOptions();
        populateSupplierDropdown();
        supplierSelect.value = itemToEdit.supplier;
        quantityInput.value = itemToEdit.quantity;
        weightPerBoxSelect.value = itemToEdit.weightPerBox;
        remainingKgInput.value = itemToEdit.remainingKg;
        entryDateInput.value = itemToEdit.entryDate;
        
        const historyItem = remainingKgHistory.find(h => h.targetItemId === id);
        previousRemainingKgSelect.value = '';
        oldRemainingKgItemIdInput.value = '';
        usedRemainingKgAmountInput.value = '';
        remainingKgHelp.classList.add('hidden');

        populatePreviousRemainingKgDropdown();

        if (historyItem) {
            oldRemainingKgItemIdInput.value = historyItem.sourceItemId;
            usedRemainingKgAmountInput.value = historyItem.amountUsed;
            previousRemainingKgSelect.value = historyItem.sourceItemId;
            remainingKgHelp.textContent = `Số dư cũ (${historyItem.amountUsed.toFixed(2)} kg) từ sản phẩm này đã được tận dụng.`;
            remainingKgHelp.classList.remove('hidden');
        }

        editingItemIdInput.value = itemToEdit.id;
        submitButton.textContent = 'Cập nhật thông tin đóng gói';
        submitButton.classList.remove('btn-primary');
        submitButton.classList.add('btn-success');
        $('#inventoryModalLabel').text('Chỉnh sửa thông tin đóng gói');
        inventoryModal.modal('show');
    }
}

/**
 * Hàm hủy bỏ chế độ chỉnh sửa và đặt lại form.
 */
function cancelEdit() {
    inventoryForm.reset();
    editingItemIdInput.value = '';
    oldRemainingKgItemIdInput.value = '';
    usedRemainingKgAmountInput.value = '';
    submitButton.textContent = 'Lưu thông tin đóng gói';
    submitButton.classList.remove('btn-success');
    submitButton.classList.add('btn-primary');
    remainingKgInput.value = 0;
    remainingKgHelp.classList.add('hidden');
    $('#inventoryModalLabel').text('Nhập thông tin đóng gói');
    updateWeightOptions();
    populatePreviousRemainingKgDropdown();
    populateSupplierDropdown();
    newSupplierInput.classList.add('hidden');
    newSupplierInput.value = '';
    newSupplierInput.removeAttribute('required');
    supplierSelect.setAttribute('required', 'required');
}

/**
 * Hàm tạo và hiển thị báo cáo thống kê tổng số kg đóng gói trong tháng hiện tại (hiện tại chỉ hoạt động trên dữ liệu trong bộ nhớ).
 */
function generateMonthlyReport() {
    let totalKgInMonth = 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    inventory.forEach(item => {
        const itemDate = new Date(item.entryDate);
        if (itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear) {
            totalKgInMonth += item.totalKg;
        }
    });

    monthlyTotalKgElement.textContent = `${totalKgInMonth.toFixed(2)} kg`;
}

/**
 * Hàm tạo và hiển thị báo cáo thống kê số dư kg hàng ngày (hiện tại chỉ hoạt động trên dữ liệu trong bộ nhớ).
 */
function generateDailyRemainingKgReport() {
    const dailyRemainingKg = {};

    inventory.forEach(item => {
        const remainingKgOfItem = item.remainingKg;
        if (remainingKgOfItem > 0) {
            const date = item.entryDate;
            if (dailyRemainingKg[date]) {
                dailyRemainingKg[date] += remainingKgOfItem;
            } else {
                dailyRemainingKg[date] = remainingKgOfItem;
            }
        }
    });

    dailyRemainingKgReportTable.innerHTML = '';

    const sortedDates = Object.keys(dailyRemainingKg).sort();

    if (sortedDates.length === 0) {
        noDailyReportMessage.classList.remove('hidden');
    } else {
        noDailyReportMessage.classList.add('hidden');
        sortedDates.forEach(date => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${date}</td>
                <td>${dailyRemainingKg[date].toFixed(2)} kg</td>
            `;
            dailyRemainingKgReportTable.appendChild(row);
        });
    }
}

/**
 * Hàm tạo và hiển thị báo cáo lịch sử sử dụng số dư kg (hiện tại chỉ hoạt động trên dữ liệu trong bộ nhớ).
 */
function generateRemainingKgHistoryReport() {
    remainingKgHistoryList.innerHTML = '';

    if (remainingKgHistory.length === 0) {
        noHistoryMessage.classList.remove('hidden');
    } else {
        noHistoryMessage.classList.add('hidden');
        remainingKgHistory.forEach(historyItem => {
            const sourceItem = inventory.find(item => item.id === historyItem.sourceItemId);
            const targetItem = inventory.find(item => item.id === historyItem.targetItemId);

            if (!sourceItem || !targetItem) return;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${historyItem.dateUsed}</td>
                <td>${sourceItem.productName}</td>
                <td>${targetItem.productName}</td>
                <td>${historyItem.amountUsed.toFixed(2)} kg</td>
            `;
            remainingKgHistoryList.appendChild(row);
        });
    }
}

/**
 * Xử lý chuyển đổi giữa các phần nội dung khi nhấp vào thanh bên.
 */
navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();

        navLinks.forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');

        const targetId = this.getAttribute('href');

        inventoryManagementSection.classList.add('hidden');
        inventoryReportSection.classList.add('hidden');

        if (targetId === '#inventory-management') {
            inventoryManagementSection.classList.remove('hidden');
            contentHeaderTitle.textContent = 'Đóng gói hàng';
            breadcrumbActive.textContent = 'Đóng gói hàng';
            cancelEdit();
        } else if (targetId === '#inventory-report') {
            inventoryReportSection.classList.remove('hidden');
            contentHeaderTitle.textContent = 'Báo cáo thống kê';
            breadcrumbActive.textContent = 'Báo cáo thống kê';
            generateMonthlyReport();
            generateDailyRemainingKgReport();
            generateRemainingKgHistoryReport();
        }
    });
});

// Đặt lại form khi modal bị đóng
inventoryModal.on('hidden.bs.modal', function() {
    cancelEdit();
});

// Tải dữ liệu đóng gói và hiển thị khi trang được tải
window.onload = function() {
    loadAllData(); // Hiện tại chỉ khởi tạo mảng rỗng
    renderInventory();
    updateWeightOptions();
    populatePreviousRemainingKgDropdown();
    populateSupplierDropdown();
};
