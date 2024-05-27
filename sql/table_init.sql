CREATE database convoy;

use convoy;

-- Create a table for companies
CREATE TABLE IF NOT EXISTS companies (
    company_id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(255) NOT NULL,
    company_desc VARCHAR(255) NOT NULL
);

insert into convoy.companies (company_name, company_desc) values ("Default", "Default");

-- Create a table for user roles
CREATE TABLE IF NOT EXISTS user_roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL
);

-- Insert possible user roles
INSERT INTO user_roles (role_name) VALUES ('System Admin'), ('Company Owner'), ('User');

-- Create a table for users
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    company_id INT,
    role_id INT,
    FOREIGN KEY (company_id) REFERENCES companies(company_id),
    FOREIGN KEY (role_id) REFERENCES user_roles(role_id)
);

-- Create a table for datasets
CREATE TABLE IF NOT EXISTS datasets (
    dataset_id INT PRIMARY KEY AUTO_INCREMENT,
    dataset_name VARCHAR(100) NOT NULL,
    company_id INT,
    user_id INT,
    FOREIGN KEY (company_id) REFERENCES companies(company_id),
    FOREIGN KEY (user_id) references users(user_id)
);

-- Create a table for job records
CREATE TABLE IF NOT EXISTS jobs (
    job_id VARCHAR(255) PRIMARY KEY,
    dataset_id INT,
    user_id INT,
    company_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (dataset_id) REFERENCES datasets(dataset_id),
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

CREATE USER 'convoy'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON convoy.* TO 'convoy'@'%';
FLUSH PRIVILEGES;