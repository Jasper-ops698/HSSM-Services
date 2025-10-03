console.log("Frontend setup is working!");


// API Configuration
// Prefer an explicit window-global base URL if the React app injects it, fall back to the original default.
const API_BASE_URL = window.__API_BASE_URL__ || 'https://hssm-2-1.onrender.com';

// Lightweight fetch wrapper used by this legacy script. It mirrors the behavior of the
// centralized frontend `api` client by prefixing the base URL and attaching the
// Authorization header from localStorage when available.
const API_BASE = (API_BASE_URL || '').replace(/\/+$/, '');
function buildUrl(path) {
    if (!path) return API_BASE;
    return path.toString().startsWith('http') ? path : (path.startsWith('/') ? API_BASE + path : API_BASE + '/' + path);
}

async function apiFetch(pathOrUrl, options = {}) {
    const url = pathOrUrl && pathOrUrl.toString().startsWith('http') ? pathOrUrl : buildUrl(pathOrUrl);
    const opts = { ...options };
    opts.headers = opts.headers ? { ...opts.headers } : {};

    // Attach token from localStorage if not already provided
    const token = localStorage.getItem('authToken') || userToken;
    if (token && !opts.headers['Authorization'] && !opts.headers['authorization']) {
        opts.headers['Authorization'] = `Bearer ${token}`;
    }

    // Default JSON Content-Type for plain objects (avoid overriding FormData)
    if (opts.body && !(opts.body instanceof FormData) && !opts.headers['Content-Type']) {
        opts.headers['Content-Type'] = 'application/json';
        if (typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);
    }

    return fetch(url, opts);
}

// Authentication state
let isLoggedIn = false;
let userToken = null;
let userData = null;

// DOM elements
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const googleSignInBtn = document.getElementById('google-signin-btn');
const logoutLink = document.getElementById('logout-link');

// Check authentication status on page load
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('userData');

    if (token && user) {
        userToken = token;
        userData = JSON.parse(user);
        isLoggedIn = true;
        showApp();
    } else {
        showLogin();
    }
}

// Show login screen
function showLogin() {
    loginContainer.classList.remove('hidden');
    appContainer.classList.remove('logged-in');
}

// Show main app
function showApp() {
    loginContainer.classList.add('hidden');
    appContainer.classList.add('logged-in');
    updateNavigationVisibility();
    loadUserData();
    if (userData.role === 'student') {
        loadStudentDashboard();
    }
}

// Handle Google Sign-In
async function handleGoogleSignIn() {
    try {
        // Initialize Google Sign-In
        const clientId = '1030828567617-6qjdpjjhceiit0sf6aem2vdipoospsd3.apps.googleusercontent.com'; // Your Google Client ID

        google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse
        });

        google.accounts.id.prompt();

    } catch (error) {
        console.error('Google Sign-In error:', error);
        alert('Failed to initialize Google Sign-In. Please try again.');
    }
}

// Handle the credential response from Google
async function handleCredentialResponse(response) {
    const idToken = response.credential;

    try {
        // Send ID token to backend via apiFetch wrapper
        const result = await apiFetch('/api/auth/google', {
            method: 'POST',
            body: { idToken }
        });

        if (!result.ok) {
            throw new Error('Authentication failed');
        }

        const data = await result.json();

        // Store token and user data
        userToken = data.token;
        userData = data.user;
        localStorage.setItem('authToken', userToken);
        localStorage.setItem('userData', JSON.stringify(userData));
        isLoggedIn = true;

        showApp();

    } catch (error) {
        console.error('Authentication error:', error);
        alert('Login failed. Please try again.');
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    userToken = null;
    userData = null;
    isLoggedIn = false;
    showLogin();
}

// Simple navigation system
const mainContent = document.getElementById('main-content');
const historyStack = [];
let currentPage = 'home';

function renderPage(page) {
    let content = '';
    let backBtn = historyStack.length > 0 ? '<button class="back-btn" onclick="goBack()">← Back</button>' : '';

    switch(page) {
        case 'home':
            content = `
                <h1>Welcome to Multi-Shop</h1>
                <p>This is the home page.</p>
                <p>Navigate using the menu above.</p>
            `;
            break;
        case 'dashboard':
            if (userData && userData.role === 'teacher') {
                content = renderTeacherDashboard();
            } else if (userData && userData.role === 'student') {
                content = renderStudentDashboard();
            } else if (userData && userData.role === 'hod') {
                content = renderHodDashboard();
            } else {
                content = `
                    ${backBtn}
                    <h1>Dashboard</h1>
                    <p>Overview of the system.</p>
                    <div class="dashboard-grid">
                        <div class="dashboard-card">
                            <h3>Total Classes</h3>
                            <p class="metric">Loading...</p>
                        </div>
                        <div class="dashboard-card">
                            <h3>Total Students</h3>
                            <p class="metric">Loading...</p>
                        </div>
                        <div class="dashboard-card">
                            <h3>Active Enrollments</h3>
                            <p class="metric">Loading...</p>
                        </div>
                    </div>
                `;
            }
            break;
        case 'classes':
            content = renderTeacherClasses();
            break;
        case 'all-classes':
            // Legacy "All Classes" page removed. Redirect users to the classes view which
            // is kept in the modern UI. This avoids a dead page while removing legacy markup.
            navigateTo('classes');
            return;
        case 'students':
            content = `
                ${backBtn}
                <h1>Students</h1>
                <p>Student management.</p>
            `;
            break;
        case 'teachers':
            content = `
                ${backBtn}
                <h1>Teachers</h1>
                <p>Teacher management.</p>
            `;
            break;
        case 'reports':
            content = `
                ${backBtn}
                <h1>Reports</h1>
                <p>System reports.</p>
            `;
            break;
        default:
            content = '<h1>Page not found</h1>';
    }
    mainContent.innerHTML = content;
}

function renderTeacherDashboard() {
    return `
        <div class="teacher-dashboard">
            <div class="dashboard-header">
                <h1>👨‍🏫 Teacher Dashboard</h1>
                <p>Welcome back, ${userData?.name || 'Teacher'}!</p>
            </div>

            <div class="dashboard-stats">
                <div class="stat-card">
                    <h3>📚 My Classes</h3>
                    <p class="stat-number" id="classes-count">Loading...</p>
                </div>
                <div class="stat-card">
                    <h3>👥 Total Students</h3>
                    <p class="stat-number" id="students-count">Loading...</p>
                </div>
                <div class="stat-card">
                    <h3>📝 Pending Tasks</h3>
                    <p class="stat-number" id="tasks-count">0</p>
                </div>
            </div>

            <div class="dashboard-actions">
                <button class="btn-primary" onclick="navigateTo('classes')">📝 Manage Classes</button>
                <button class="btn-secondary" onclick="showAttendanceModal()">📊 Mark Attendance</button>
                <button class="btn-secondary" onclick="showReportsModal()">📈 View Reports</button>
            </div>

            <div class="recent-activity">
                <h2>Recent Activity</h2>
                <div id="recent-activity-list">
                    <p>Loading recent activity...</p>
                </div>
            </div>
        </div>
    `;
}

function renderStudentDashboard() {
    return `
        <div class="student-dashboard" id="student-dashboard-content" style="display:none;">
            <div class="dashboard-header">
                <h1>🎓 Student Dashboard</h1>
                <p>Welcome back, <span id="student-name">Student</span>!</p>
            </div>

            <div class="dashboard-stats">
                <div class="stat-card">
                    <h3>💰 Credits Balance</h3>
                    <p class="stat-number" id="student-credits-balance">Loading...</p>
                </div>
                <div class="stat-card">
                    <h3>📚 My Classes</h3>
                    <p class="stat-number" id="enrolled-classes-count">Loading...</p>
                </div>
                <div class="stat-card">
                    <h3>📝 Pending Tasks</h3>
                    <p class="stat-number" id="pending-tasks-count">0</p>
                </div>
            </div>

            <div class="dashboard-actions">
                <button class="btn-secondary" onclick="showMyClasses()">� My Enrolled Classes</button>
                <button class="btn-secondary" onclick="showAnnouncements()">� Announcements</button>
            </div>

            <div class="available-classes">
                <h2>Available Classes</h2>
                <div id="available-classes-list">
                    <p>Loading available classes...</p>
                </div>
            </div>

            <div class="recent-activity">
                <h2>Recent Announcements</h2>
                <div id="student-announcements">
                    <p>Loading announcements...</p>
                </div>
            </div>
        </div>
    `;
}

function renderHodDashboard() {
    return `
        <div class="hod-dashboard">
            <div class="dashboard-header">
                <h1>👑 HOD Dashboard</h1>
                <p>Welcome, ${userData?.name || 'HOD'}!</p>
            </div>

            <div class="dashboard-stats">
                <div class="stat-card">
                    <h3>📚 Total Classes</h3>
                    <p class="stat-number" id="total-classes-count">Loading...</p>
                </div>
                <div class="stat-card">
                    <h3>👥 Total Students</h3>
                    <p class="stat-number" id="total-students-count">Loading...</p>
                </div>
                <div class="stat-card">
                    <h3>👩‍🏫 Total Teachers</h3>
                    <p class="stat-number" id="total-teachers-count">Loading...</p>
                </div>
            </div>

            <div class="dashboard-actions">
                <button class="btn-primary" onclick="showCreateAnnouncementModal()">📢 Create Announcement</button>
                <button class="btn-secondary" onclick="navigateTo('all-classes')">📚 Manage Classes</button>
                <button class="btn-secondary" onclick="navigateTo('teachers')">👩‍🏫 Manage Teachers</button>
            </div>

            <div class="recent-activity">
                <h2>Recent Announcements</h2>
                <div id="recent-announcements-list">
                    <p>Loading announcements...</p>
                </div>
            </div>
        </div>
    `;
}

function renderTeacherClasses() {
    return `
        <div class="teacher-classes">
            <div class="page-header">
                <h1>📚 My Classes</h1>
                <button class="btn-primary" onclick="showCreateClassModal()">+ Create New Class</button>
            </div>

            <div class="classes-container" id="classes-container">
                <div class="loading">Loading your classes...</div>
            </div>

            <div class="classes-actions">
                <button class="btn-outline" onclick="refreshClasses()">🔄 Refresh</button>
            </div>
        </div>
    `;
}

function navigateTo(page) {
    historyStack.push(currentPage);
    currentPage = page;
    renderPage(page);
    window.history.pushState({page}, '', `#${page}`);
    // Close mobile menu after navigation
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    hamburger.classList.remove('open');
    navMenu.classList.remove('open');
}

function goBack() {
    if (historyStack.length > 0) {
        currentPage = historyStack.pop();
        renderPage(currentPage);
        window.history.back();
    }
}

function changePage(section, pageNum) {
    // Simulate pagination
    alert(`Navigating to ${section} page ${pageNum}`);
}

// Event listeners for navigation
document.getElementById('home-link').addEventListener('click', (e) => { e.preventDefault(); navigateTo('home'); });
document.getElementById('dashboard-link').addEventListener('click', (e) => { e.preventDefault(); navigateTo('dashboard'); });
// Classes navigation removed
document.getElementById('students-link').addEventListener('click', (e) => { e.preventDefault(); navigateTo('students'); });
document.getElementById('teachers-link').addEventListener('click', (e) => { e.preventDefault(); navigateTo('teachers'); });
document.getElementById('reports-link').addEventListener('click', (e) => { e.preventDefault(); navigateTo('reports'); });
document.getElementById('chat-link').addEventListener('click', (e) => { e.preventDefault(); showChat(); });
document.getElementById('logout-link').addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
});

// Role-based navigation visibility
function updateNavigationVisibility() {
    if (!userData || !userData.role) return;

    const role = userData.role.toLowerCase();
    const roleSpecificItems = document.querySelectorAll('.role-specific');

    roleSpecificItems.forEach(item => {
        const allowedRoles = item.getAttribute('data-roles').split(',');
        const isVisible = allowedRoles.some(allowedRole => allowedRole.trim().toLowerCase() === role);
        item.style.display = isVisible ? 'block' : 'none';
    });

    // Update dashboard link text based on role
    const dashboardLink = document.getElementById('dashboard-link');
    if (role === 'teacher') {
        dashboardLink.textContent = 'Teacher Dashboard';
    } else if (role === 'admin') {
        dashboardLink.textContent = 'Admin Dashboard';
    } else if (role === 'hod') {
        dashboardLink.textContent = 'HOD Dashboard';
    } else if (role === 'student') {
        dashboardLink.textContent = 'Student Dashboard';
    } else {
        dashboardLink.textContent = 'Dashboard';
    }
}

// User data loading based on role
function loadUserData() {
    if (userData && userData.role === 'teacher') {
        loadTeacherData();
    } else if (userData && userData.role === 'student') {
        loadStudentData();
    } else if (userData && userData.role === 'hod') {
        loadHodData();
    }
}

// Teacher-specific functions
function loadTeacherData() {
    if (userData && userData.role === 'teacher') {
        loadTeacherDashboardData();
        loadTeacherClasses();
    }
}

// HOD-specific functions
function loadHodData() {
    if (userData && userData.role === 'hod') {
        loadHodDashboardData();
    }
}

async function loadHodDashboardData() {
    try {
        const response = await apiFetch('/api/hod/dashboard');

        if (response.ok) {
            const data = await response.json();
            updateHodDashboard(data);
        } else {
            console.error('Failed to load HOD dashboard data');
        }
    } catch (error) {
        console.error('Error loading HOD dashboard data:', error);
    }
}

function updateHodDashboard(data) {
    // Update stats
    document.getElementById('total-classes-count').textContent = data.kpi?.totalClasses || 0;
    document.getElementById('total-students-count').textContent = data.kpi?.totalStudents || 0;
    document.getElementById('total-teachers-count').textContent = data.kpi?.totalTeachers || 0;

    // Update announcements
    const announcementsList = document.getElementById('recent-announcements-list');
    if (announcementsList && data.announcements) {
        if (data.announcements.length === 0) {
            announcementsList.innerHTML = '<p>No recent announcements.</p>';
        } else {
            const announcementsHTML = data.announcements.map(announcement => `
                <div class="announcement-item">
                    <h4>${announcement.title}</h4>
                    <p>${announcement.message.substring(0, 100)}...</p>
                    <small>${new Date(announcement.createdAt).toLocaleDateString()}</small>
                </div>
            `).join('');
            announcementsList.innerHTML = announcementsHTML;
        }
    }
}

// Student-specific functions
function loadStudentData() {
    if (userData && userData.role === 'student') {
        loadStudentDashboardData();
    }
}

async function loadStudentDashboardData() {
    try {
        const response = await apiFetch('/api/student/dashboard');
        if (!response.ok) throw new Error('Failed to fetch student dashboard data');
        
        const data = await response.json();
        
        // Hide default welcome message
        document.getElementById('main-content').querySelector('h1').style.display = 'none';
        document.getElementById('main-content').querySelector('p').style.display = 'none';

        // Display student dashboard
        const studentDashboard = document.getElementById('student-dashboard-content');
        studentDashboard.style.display = 'block';

        document.getElementById('student-name').textContent = data.student.name;
        document.getElementById('student-credits-balance').textContent = data.student.credits;
        document.getElementById('student-enrolled-classes-count').textContent = data.classes.length;

        // Load available classes for enrollment
        loadAvailableClasses();

        // Announcements
        const announcementsContainer = document.getElementById('student-announcements');
        announcementsContainer.innerHTML = '';
        if (data.announcements.length > 0) {
            data.announcements.forEach(ann => {
                const annElement = document.createElement('div');
                annElement.className = 'announcement-item';
                annElement.innerHTML = `
                    <h4>${ann.title}</h4>
                    <p>${ann.content}</p>
                    <small>${new Date(ann.createdAt).toLocaleString()}</small>
                `;
                announcementsContainer.appendChild(annElement);
            });
        } else {
            announcementsContainer.innerHTML = '<p>No recent announcements.</p>';
        }
    } catch (error) {
        console.error('Error loading student dashboard:', error);
        document.getElementById('main-content').innerHTML = '<p class="error">Could not load dashboard. Please try again later.</p>';
    }
}

// Fetch and display available classes for student enrollment
async function loadAvailableClasses() {
    const container = document.getElementById('available-classes-list');
    if (!container) return;
    try {
        const response = await apiFetch('/api/classes');
        if (!response.ok) throw new Error('Failed to fetch classes');
        const classes = await response.json();
        if (!classes || classes.length === 0) {
            container.innerHTML = '<p>No available classes found.</p>';
            return;
        }
        container.innerHTML = classes.map(cls => `
            <div class="class-card">
                <div class="class-header">
                    <h3>${cls.name}</h3>
                </div>
                <p>${cls.description}</p>
                <div class="class-info">
                    <span>📚 Credits: ${cls.creditsRequired}</span>
                    <span>👨‍🏫 Teacher: ${cls.teacher?.name || 'N/A'}</span>
                </div>
                <div class="class-actions">
                    <button class="btn-primary" onclick="enrollInClass('${cls._id}', this)">Enroll</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p class="error">Failed to load available classes.</p>';
    }
}

// Enroll in class and show pending approval
async function enrollInClass(classId, btn) {
    if (!confirm('Are you sure you want to enroll in this class?')) return;
    btn.disabled = true;
    btn.textContent = 'Enrolling...';
    try {
        const response = await apiFetch('/api/enrollments/request', {
            method: 'POST',
            body: { classId }
        });
        if (response.ok) {
            btn.textContent = 'Pending Approval';
            btn.classList.add('btn-secondary');
        } else {
            const error = await response.json();
            btn.textContent = 'Enroll';
            btn.disabled = false;
            alert('Failed to enroll: ' + (error.message || 'Unknown error'));
        }
    } catch (error) {
        btn.textContent = 'Enroll';
        btn.disabled = false;
        alert('Failed to enroll. Please try again.');
    }
}

async function loadTeacherDashboardData() {
    try {
        const response = await apiFetch('/api/teacher/dashboard');

        if (response.ok) {
            const data = await response.json();
            updateTeacherDashboard(data);
        } else {
            console.error('Failed to load teacher dashboard data');
        }
    } catch (error) {
        console.error('Error loading teacher dashboard data:', error);
    }
}

function updateTeacherDashboard(data) {
    const classesCountEl = document.getElementById('classes-count');
    const studentsCountEl = document.getElementById('students-count');

    if (classesCountEl) {
        classesCountEl.textContent = data.totalClasses ?? '0';
    }
    if (studentsCountEl) {
        studentsCountEl.textContent = data.totalStudents ?? '0';
    }

    // Optional: Update recent activity if the element exists
    const recentActivityList = document.getElementById('recent-activity-list');
    if (recentActivityList && data.recentActivity) {
        if (data.recentActivity.length > 0) {
            recentActivityList.innerHTML = data.recentActivity.map(activity =>
                `<div class="activity-item">
                    <p>${activity.description}</p>
                    <small>${new Date(activity.timestamp).toLocaleString()}</small>
                </div>`
            ).join('');
        } else {
            recentActivityList.innerHTML = '<p>No recent activity.</p>';
        }
    }
}

async function loadTeacherClasses() {
    try {
        const response = await apiFetch('/api/teacher/classes');

        if (response.ok) {
            const classes = await response.json();
            renderClassesList(classes);
        }
    } catch (error) {
        console.error('Error loading teacher classes:', error);
        const container = document.getElementById('classes-container');
        if (container) {
            container.innerHTML = '<p class="error">Failed to load classes. Please try again.</p>';
        }
    }
}

function renderClassesList(classes) {
    const container = document.getElementById('classes-container');
    if (!container) return;

    if (!classes || classes.length === 0) {
        container.innerHTML = '<p>No classes found. <button onclick="showCreateClassModal()">Create your first class</button></p>';
        return;
    }

    const classesHTML = classes.map(cls => `
        <div class="class-card">
            <div class="class-header">
                <h3>${cls.name}</h3>
                <div class="class-actions">
                    <button onclick="editClass('${cls._id}')" class="btn-small">Edit</button>
                    <button onclick="deleteClass('${cls._id}')" class="btn-small btn-danger">Delete</button>
                </div>
            </div>
            <p>${cls.description}</p>
            <div class="class-info">
                <span>📚 Credits: ${cls.creditsRequired}</span>
                <span>👥 Students: ${cls.enrolledStudents?.length || 0}</span>
            </div>
            <div class="class-actions">
                <button onclick="viewClassDetails('${cls._id}')" class="btn-outline">View Details</button>
                <button onclick="manageAttendance('${cls._id}')" class="btn-outline">Mark Attendance</button>
            </div>
        </div>
    `).join('');

    container.innerHTML = classesHTML;
}

// Modal functions
function showCreateClassModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2>Create New Class</h2>
                <button onclick="closeModal()" class="close-btn">&times;</button>
            </div>
            <form id="create-class-form">
                <div class="form-group">
                    <label for="class-name">Class Name *</label>
                    <input type="text" id="class-name" required>
                </div>
                <div class="form-group">
                    <label for="class-description">Description *</label>
                    <textarea id="class-description" required></textarea>
                </div>
                <div class="form-group">
                    <label for="credits-required">Credits Required *</label>
                    <input type="number" id="credits-required" min="1" required>
                </div>
                <div class="form-actions">
                    <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Create Class</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Handle form submission
    const form = document.getElementById('create-class-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await createNewClass();
    });
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

async function createNewClass() {
    const name = document.getElementById('class-name').value;
    const description = document.getElementById('class-description').value;
    const creditsRequired = document.getElementById('credits-required').value;

    try {
        const response = await apiFetch('/api/teacher/class', {
            method: 'POST',
            body: { name, description, creditsRequired }
        });

        if (response.ok) {
            closeModal();
            loadTeacherClasses(); // Refresh the classes list
            alert('Class created successfully!');
        } else {
            const error = await response.json();
            alert('Failed to create class: ' + (error.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error creating class:', error);
        alert('Failed to create class. Please try again.');
    }
}

function showCreateAnnouncementModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2>Create New Announcement</h2>
                <button onclick="closeModal()" class="close-btn">&times;</button>
            </div>
            <form id="create-announcement-form">
                <div class="form-group">
                    <label for="announcement-title">Title *</label>
                    <input type="text" id="announcement-title" required>
                </div>
                <div class="form-group">
                    <label for="announcement-content">Content *</label>
                    <textarea id="announcement-content" required></textarea>
                </div>
                <div class="form-group">
                    <label for="announcement-priority">Priority</label>
                    <select id="announcement-priority">
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                        <option value="high">High</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Create Announcement</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    const form = document.getElementById('create-announcement-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await createNewAnnouncement();
    });
}

async function createNewAnnouncement() {
    const title = document.getElementById('announcement-title').value;
    const content = document.getElementById('announcement-content').value;
    const priority = document.getElementById('announcement-priority').value;

    try {
        const response = await apiFetch('/api/announcements', {
            method: 'POST',
            body: { title, content, priority, targetRoles: ['all'] }
        });

        if (response.ok) {
            closeModal();
            loadHodDashboardData(); // Refresh announcements
            alert('Announcement created successfully!');
        } else {
            const error = await response.json();
            alert('Failed to create announcement: ' + (error.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error creating announcement:', error);
        alert('Failed to create announcement. Please try again.');
    }
}

function showAttendanceModal() {
    alert('Attendance marking feature coming soon!');
}

function showReportsModal() {
    alert('Reports feature coming soon!');
}

function editClass(classId) {
    alert(`Edit class ${classId} - Feature coming soon!`);
}

function deleteClass(classId) {
    if (confirm('Are you sure you want to delete this class?')) {
        alert(`Delete class ${classId} - Feature coming soon!`);
    }
}

function viewClassDetails(classId) {
    alert(`View details for class ${classId} - Feature coming soon!`);
}

function manageAttendance(classId) {
    alert(`Manage attendance for class ${classId} - Feature coming soon!`);
}

function refreshClasses() {
    loadTeacherClasses();
}

// Student action functions
function showMyClasses() {
    alert('My Classes feature coming soon!');
}

function showAnnouncements() {
    alert('Announcements feature coming soon!');
}

// Event listeners for Google Sign-In
googleSignInBtn.addEventListener('click', handleGoogleSignIn);

// Hamburger menu toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navMenu.classList.toggle('open');
});

// Handle browser back/forward
window.addEventListener('popstate', (e) => {
    if (e.state && e.state.page) {
        currentPage = e.state.page;
        renderPage(currentPage);
    }
});

// Initialize app
checkAuthStatus();

// ===== Legacy chat functionality removed =====
// The static chat widget was removed and replaced by the React-based chat component.
// Keep minimal stubs to avoid runtime errors from any remaining legacy calls.

function initializeChat() {
    // No-op. Chat is now implemented in the React SPA (Home.js -> CustomChat).
}

function updateChatAvailability() {
    // No-op compatibility stub
}

function showApp() {
    // Existing showApp implementation lives earlier in this file; if overridden elsewhere, this stub ensures compatibility.
}

function showLogin() {
    // No-op
}

// Ensure DOMContentLoaded handlers don't reference removed elements
document.addEventListener('DOMContentLoaded', () => {
    // Nothing to initialize for legacy chat.
});

window.addEventListener('resize', () => {
    // No legacy resize handling required for removed chat UI.
});
