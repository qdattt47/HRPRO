-- Tạo bảng departments (phòng ban)
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(3) NOT NULL UNIQUE,  -- Mã phòng ban
    name VARCHAR(100) NOT NULL,       -- Tên phòng ban
    founded_year INT,                 -- Năm thành lập
    status ENUM('active', 'inactive') DEFAULT 'active',  -- Trạng thái phòng ban
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     -- Thời gian tạo
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  -- Thời gian cập nhật
);

-- Tạo bảng positions (chức vụ)
CREATE TABLE positions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(1) NOT NULL UNIQUE,  -- Mã chức vụ
    name VARCHAR(100) NOT NULL,       -- Tên chức vụ
    description VARCHAR(255),         -- Mô tả chức vụ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Thời gian tạo
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  -- Thời gian cập nhật
);

-- Tạo bảng employees (nhân viên)
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,  -- Mã nhân viên (sinh tự động)
    name VARCHAR(150) NOT NULL,        -- Tên nhân viên
    department_id INT NOT NULL,        -- Mã phòng ban (khóa ngoại)
    position_id INT NOT NULL,          -- Mã chức vụ (khóa ngoại)
    base_salary DECIMAL(15, 2) NOT NULL,  -- Lương cơ bản
    status ENUM('active', 'inactive') DEFAULT 'active',  -- Trạng thái nhân viên
    join_order INT NOT NULL,           -- Thứ tự vào công ty (join order)
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Ngày vào công ty
    photo_url VARCHAR(255),            -- URL hình ảnh nhân viên
    account VARCHAR(100) NOT NULL,     -- Tài khoản nhân viên
    password_hash VARCHAR(255) NOT NULL,  -- Mật khẩu (băm)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Thời gian tạo
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- Thời gian cập nhật
    FOREIGN KEY (department_id) REFERENCES departments(id),  -- Khóa ngoại phòng ban
    FOREIGN KEY (position_id) REFERENCES positions(id)      -- Khóa ngoại chức vụ
);

-- Tạo bảng work_sessions (chấm công)
CREATE TABLE work_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,           -- Mã nhân viên (khóa ngoại)
    checkin DATETIME NOT NULL,          -- Thời gian check-in
    checkout DATETIME NOT NULL,         -- Thời gian check-out
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Thời gian tạo
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- Thời gian cập nhật
    FOREIGN KEY (employee_id) REFERENCES employees(id)  -- Khóa ngoại nhân viên
);

-- Tạo bảng monthly_salaries (lương tháng)
CREATE TABLE monthly_salaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,         -- Mã nhân viên (khóa ngoại)
    year INT NOT NULL,                -- Năm tính lương
    month INT NOT NULL,               -- Tháng tính lương
    total_hours DECIMAL(10, 2) NOT NULL,  -- Tổng số giờ làm việc trong tháng
    overtime_hours DECIMAL(10, 2) NOT NULL,  -- Số giờ làm thêm
    base_salary DECIMAL(15, 2) NOT NULL,  -- Lương cơ bản của nhân viên
    overtime_salary DECIMAL(15, 2) NOT NULL,  -- Lương làm thêm
    total_salary DECIMAL(15, 2) NOT NULL,  -- Tổng lương (cơ bản + làm thêm)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Thời gian tạo
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- Thời gian cập nhật
    FOREIGN KEY (employee_id) REFERENCES employees(id)  -- Khóa ngoại nhân viên
);
