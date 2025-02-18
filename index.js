require('dotenv').config();
const inquirer = require('inquirer');
const db = require('./db');
const cTable = require('console.table');

// Start the CLI application
function startApp() {
    inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                'View all departments',
                'View all roles',
                'View all employees',
                'Add a department',
                'Add a role',
                'Add an employee',
                'Update an employee role',
                'Exit'
            ]
        }
    ]).then(answers => {
        switch (answers.action) {
            case 'View all departments': return viewDepartments();
            case 'View all roles': return viewRoles();
            case 'View all employees': return viewEmployees();
            case 'Add a department': return addDepartment();
            case 'Add a role': return addRole();
            case 'Add an employee': return addEmployee();
            case 'Update an employee role': return updateEmployeeRole();
            default:
                db.end();
                console.log('Goodbye!');
                process.exit();
        }
    });
}

// View all departments
function viewDepartments() {
    db.query('SELECT * FROM department', (err, res) => {
        if (err) throw err;
        console.log(cTable.getTable(res.rows));
        startApp();
    });
}

// View all roles
function viewRoles() {
    db.query(`
    SELECT role.id, role.title, department.name AS department, role.salary 
    FROM role 
    JOIN department ON role.department_id = department.id`, 
    (err, res) => {
        if (err) throw err;
        console.log(cTable.getTable(res.rows));
        startApp();
    });
}

// View all employees
function viewEmployees() {
    db.query(`
    SELECT e.id, e.first_name, e.last_name, role.title, department.name AS department, role.salary, 
           CONCAT(m.first_name, ' ', m.last_name) AS manager
    FROM employee e
    JOIN role ON e.role_id = role.id
    JOIN department ON role.department_id = department.id
    LEFT JOIN employee m ON e.manager_id = m.id`, 
    (err, res) => {
        if (err) throw err;
        console.log(cTable.getTable(res.rows));
        startApp();
    });
}

// Add a department
function addDepartment() {
    inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Enter the new department name:',
            validate: input => input ? true : 'Department name cannot be empty!'
        }
    ]).then(answer => {
        db.query('INSERT INTO department (name) VALUES ($1)', [answer.name], (err) => {
            if (err) throw err;
            console.log(`✅ Department "${answer.name}" added successfully!`);
            startApp();
        });
    });
}

// Add a role
function addRole() {
    db.query('SELECT * FROM department', (err, res) => {
        if (err) throw err;
        const departments = res.rows.map(({ id, name }) => ({ name, value: id }));

        inquirer.prompt([
            {
                type: 'input',
                name: 'title',
                message: 'Enter the role title:',
                validate: input => input ? true : 'Role title cannot be empty!'
            },
            {
                type: 'input',
                name: 'salary',
                message: 'Enter the role salary:',
                validate: input => isNaN(input) ? 'Salary must be a number!' : true
            },
            {
                type: 'list',
                name: 'department_id',
                message: 'Select the department for this role:',
                choices: departments
            }
        ]).then(answer => {
            db.query('INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)', 
            [answer.title, answer.salary, answer.department_id], (err) => {
                if (err) throw err;
                console.log(`✅ Role "${answer.title}" added successfully!`);
                startApp();
            });
        });
    });
}

// Add an employee
function addEmployee() {
    db.query('SELECT * FROM role', (err, roleRes) => {
        if (err) throw err;
        const roles = roleRes.rows.map(({ id, title }) => ({ name: title, value: id }));

        db.query('SELECT * FROM employee', (err, empRes) => {
            if (err) throw err;
            const managers = empRes.rows.map(({ id, first_name, last_name }) => ({
                name: `${first_name} ${last_name}`, value: id
            }));
            managers.push({ name: 'None', value: null });

            inquirer.prompt([
                {
                    type: 'input',
                    name: 'first_name',
                    message: 'Enter employee first name:',
                    validate: input => input ? true : 'First name cannot be empty!'
                },
                {
                    type: 'input',
                    name: 'last_name',
                    message: 'Enter employee last name:',
                    validate: input => input ? true : 'Last name cannot be empty!'
                },
                {
                    type: 'list',
                    name: 'role_id',
                    message: 'Select employee role:',
                    choices: roles
                },
                {
                    type: 'list',
                    name: 'manager_id',
                    message: 'Select employee manager:',
                    choices: managers
                }
            ]).then(answer => {
                db.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)', 
                [answer.first_name, answer.last_name, answer.role_id, answer.manager_id], (err) => {
                    if (err) throw err;
                    console.log(`✅ Employee "${answer.first_name} ${answer.last_name}" added successfully!`);
                    startApp();
                });
            });
        });
    });
}

// Update an employee's role
function updateEmployeeRole() {
    db.query('SELECT * FROM employee', (err, empRes) => {
        if (err) throw err;
        const employees = empRes.rows.map(({ id, first_name, last_name }) => ({
            name: `${first_name} ${last_name}`, value: id
        }));

        db.query('SELECT * FROM role', (err, roleRes) => {
            if (err) throw err;
            const roles = roleRes.rows.map(({ id, title }) => ({ name: title, value: id }));

            inquirer.prompt([
                {
                    type: 'list',
                    name: 'employee_id',
                    message: 'Select the employee to update:',
                    choices: employees
                },
                {
                    type: 'list',
                    name: 'role_id',
                    message: 'Select the new role:',
                    choices: roles
                }
            ]).then(answer => {
                db.query('UPDATE employee SET role_id = $1 WHERE id = $2', 
                [answer.role_id, answer.employee_id], (err) => {
                    if (err) throw err;
                    console.log(`✅ Employee role updated successfully!`);
                    startApp();
                });
            });
        });
    });
}

// Start the app
startApp();