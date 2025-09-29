// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';
let authToken = localStorage.getItem('authToken');

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Authentication Functions
async function login(email, password) {
  try {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    authToken = response.token;
    localStorage.setItem('authToken', authToken);
    return response;
  } catch (error) {
    throw error;
  }
}

async function register(name, email, password) {
  try {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role: 'student' })
    });
    
    authToken = response.token;
    localStorage.setItem('authToken', authToken);
    return response;
  } catch (error) {
    throw error;
  }
}

// PITCH GENERATOR
document.getElementById("generateBtn").addEventListener("click", async () => {
    const idea = document.getElementById("ideaInput").value.trim();
    const output = document.getElementById("pitchOutput");
    const generateBtn = document.getElementById("generateBtn");
  
    if (!idea) {
      output.innerHTML = "<p class='text-red-400'>⚠️ Please enter your idea first.</p>";
      return;
    }

    if (!authToken) {
      output.innerHTML = "<p class='text-red-400'>⚠️ Please login first to generate pitches.</p>";
      return;
    }

    // Show loading state
    generateBtn.disabled = true;
    generateBtn.textContent = "Generating...";
    output.innerHTML = "<p class='text-blue-400'>🤖 AI is crafting your pitch...</p>";

    try {
      const response = await apiRequest('/ideas', {
        method: 'POST',
        body: JSON.stringify({
          title: idea.substring(0, 50) + (idea.length > 50 ? '...' : ''),
          originalInput: idea,
          context: 'startup',
          tone: 'persuasive'
        })
      });

      output.innerHTML = `
        <h4 class="text-xl font-bold mb-3 text-green-400">🔥 Hackathon Pitch (3–4 min) — eLearning & Communication Theme</h4>
        <div class="space-y-5 text-gray-200">
          <hr class="border-white/10" />
          <div>
            <h5 class="font-semibold text-indigo-300 mb-2">1️⃣ Hook (10–15 sec)</h5>
            <p>“Imagine being a student with great ideas but struggling to communicate them clearly — whether it’s for class presentations, startup pitches, or competitions.<br/>
            Our platform helps students express their creativity and ideas confidently, every single time.”</p>
          </div>
          <hr class="border-white/10" />
          <div>
            <h5 class="font-semibold text-indigo-300 mb-2">2️⃣ Problem (30 sec)</h5>
            <p>“Students today face 2 major challenges in learning & communication:</p>
            <p>1. Ideas → Creativity exists, but students struggle to structure thoughts into strong presentations or scripts.</p>
            <p>2. Interviews → No realistic practice, so confidence drops when presenting or speaking in front of others.</p>
            <p>We want to bridge this gap with one connected platform.”</p>
          </div>
          <hr class="border-white/10" />
          <div>
            <h5 class="font-semibold text-indigo-300 mb-2">3️⃣ Solution (1 min)</h5>
            <p>“Our solution is an AI-powered communication toolkit, with 2 main tools:</p>
            <p>1️⃣ AI Idea Refiner → Turns messy notes or rough ideas into clear, persuasive pitch scripts, slide drafts, and one-page summaries. Instant AI feedback on clarity, persuasiveness and structure.”</p>
          </div>
        </div>
      `;
    } catch (error) {
      output.innerHTML = `<p class='text-red-400'>❌ Error: ${error.message}</p>`;
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = "Generate Pitch 🚀";
    }
  });
  
  document.getElementById("copyPitch").addEventListener("click", () => {
    const text = document.getElementById("pitchOutput").innerText;
    navigator.clipboard.writeText(text).then(() => {
      alert("Pitch copied to clipboard! ✅");
    });
  });
  
// Mock Interview Variables
let currentInterviewId = null;
let currentQuestionId = null;

// MOCK INTERVIEW
document.getElementById("sendBtn").addEventListener("click", sendMessage);
document.getElementById("userInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

async function startMockInterview() {
  if (!authToken) {
    alert("Please login first to start a mock interview.");
    return;
  }

  try {
    const response = await apiRequest('/interviews', {
      method: 'POST',
      body: JSON.stringify({
        title: "Mock Interview Session",
        mode: "ai-interviewer",
        configuration: {
          role: "Software Developer",
          experienceLevel: "entry",
          duration: 30,
          questionTypes: ["technical", "behavioral"],
          difficulty: "medium"
        }
      })
    });

    currentInterviewId = response.interview.id;
    
    // Start the interview
    const startResponse = await apiRequest(`/interviews/${currentInterviewId}/start`, {
      method: 'POST'
    });

    const chatBox = document.getElementById("chatBox");
    chatBox.innerHTML = `<p class="text-gray-300"><b>AI:</b> Welcome! Let's begin your mock interview. ${startResponse.currentQuestion.question}</p>`;
    currentQuestionId = startResponse.currentQuestion.id;
    
  } catch (error) {
    console.error('Error starting interview:', error);
    alert(`Error starting interview: ${error.message}`);
  }
}

async function sendMessage() {
  const input = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");
  const userText = input.value.trim();
  const sendBtn = document.getElementById("sendBtn");
  
  if (!userText) return;

  if (!authToken) {
    alert("Please login first to participate in mock interviews.");
    return;
  }

  if (!currentInterviewId) {
    await startMockInterview();
    return;
  }

  // Show user message
  chatBox.innerHTML += `<p class="text-indigo-400"><b>You:</b> ${userText}</p>`;
  
  // Show loading state
  sendBtn.disabled = true;
  sendBtn.textContent = "Sending...";
  
  try {
    // Submit response
    const response = await apiRequest(`/interviews/${currentInterviewId}/responses`, {
      method: 'POST',
      body: JSON.stringify({
        questionId: currentQuestionId,
        answerText: userText,
        responseTime: 30
      })
    });

    // Get next question or feedback
    if (response.nextQuestion) {
      setTimeout(() => {
        chatBox.innerHTML += `<p class="text-gray-300"><b>AI:</b> ${response.nextQuestion.question}</p>`;
        currentQuestionId = response.nextQuestion.id;
        chatBox.scrollTop = chatBox.scrollHeight;
      }, 1000);
    } else if (response.feedback) {
      setTimeout(() => {
        chatBox.innerHTML += `<p class="text-green-400"><b>AI:</b> Great! Here's your feedback: ${response.feedback}</p>`;
        chatBox.scrollTop = chatBox.scrollHeight;
      }, 1000);
    }
    
  } catch (error) {
    console.error('Error sending message:', error);
    chatBox.innerHTML += `<p class="text-red-400"><b>Error:</b> ${error.message}</p>`;
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
    input.value = "";
  }
}

// Authentication Event Handlers
document.getElementById("loginBtn").addEventListener("click", () => {
  document.getElementById("loginModal").classList.remove("hidden");
});

document.getElementById("registerBtn").addEventListener("click", () => {
  document.getElementById("registerModal").classList.remove("hidden");
});

document.getElementById("closeLoginModal").addEventListener("click", () => {
  document.getElementById("loginModal").classList.add("hidden");
  document.getElementById("loginError").classList.add("hidden");
});

document.getElementById("closeRegisterModal").addEventListener("click", () => {
  document.getElementById("registerModal").classList.add("hidden");
  document.getElementById("registerError").classList.add("hidden");
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  authToken = null;
  localStorage.removeItem('authToken');
  updateAuthUI();
  alert("Logged out successfully!");
});

// Login Form Handler
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const errorDiv = document.getElementById("loginError");
  
  try {
    await login(email, password);
    document.getElementById("loginModal").classList.add("hidden");
    document.getElementById("loginForm").reset();
    errorDiv.classList.add("hidden");
    updateAuthUI();
    alert("Login successful!");
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.remove("hidden");
  }
});

// Register Form Handler
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const errorDiv = document.getElementById("registerError");
  
  try {
    await register(name, email, password);
    document.getElementById("registerModal").classList.add("hidden");
    document.getElementById("registerForm").reset();
    errorDiv.classList.add("hidden");
    updateAuthUI();
    alert("Registration successful!");
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.remove("hidden");
  }
});

// Update Authentication UI
function updateAuthUI() {
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  
  if (authToken) {
    loginBtn.classList.add("hidden");
    registerBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
  } else {
    loginBtn.classList.remove("hidden");
    registerBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
  }
}

// NEXT LEVEL NAVBAR FUNCTIONALITY

// Search functionality with live suggestions
const searchSuggestions = [
  'AI Pitch Generator',
  'Mock Interview',
  'About Us',
  'Login',
  'Register',
  'Help Center',
  'Documentation',
  'API Reference',
  'Pricing',
  'Contact Support'
];

function initializeSearch() {
  const searchInput = document.getElementById('searchInput');
  const suggestionsContainer = document.getElementById('searchSuggestions');
  
  if (!searchInput || !suggestionsContainer) return;

  let debounceTimer;
  
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = e.target.value.toLowerCase().trim();
      
      if (query.length === 0) {
        suggestionsContainer.classList.remove('show');
        return;
      }
      
      const filteredSuggestions = searchSuggestions.filter(item => 
        item.toLowerCase().includes(query)
      );
      
      if (filteredSuggestions.length > 0) {
        suggestionsContainer.innerHTML = filteredSuggestions
          .map(suggestion => `
            <div class="px-4 py-2 hover:bg-white/5 cursor-pointer transition-colors">
              ${suggestion}
            </div>
          `).join('');
        suggestionsContainer.classList.add('show');
      } else {
        suggestionsContainer.classList.remove('show');
      }
    }, 150);
  });
  
  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
      suggestionsContainer.classList.remove('show');
    }
  });
  
  // Handle suggestion clicks
  suggestionsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('cursor-pointer')) {
      searchInput.value = e.target.textContent;
      suggestionsContainer.classList.remove('show');
      // You can add navigation logic here
      console.log('Searching for:', e.target.textContent);
    }
  });
}

// Advanced Theme System with Dropdown
const themes = {
  dark: { name: 'Dark', color: '#3b82f6' },
  light: { name: 'Light', color: '#f59e0b' },
  vscode: { name: 'VSCode', color: '#007acc' },
  jellyfish: { name: 'Jellyfish', color: '#00d4ff' },
  neon: { name: 'Neon', color: '#00ff00' },
  sunset: { name: 'Sunset', color: '#ff6b35' },
  ocean: { name: 'Ocean', color: '#00bfff' },
  professional: { name: 'Professional', color: '#3182ce' },
  'sunset-gradient': { name: 'Sunset Gradient', color: '#ff6b35' },
  'ocean-gradient': { name: 'Ocean Gradient', color: '#00bfff' },
  'purple-gradient': { name: 'Purple Gradient', color: '#8b5cf6' },
  'green-gradient': { name: 'Green Gradient', color: '#10b981' },
  'fire-gradient': { name: 'Fire Gradient', color: '#ef4444' },
  'cosmic-gradient': { name: 'Cosmic Gradient', color: '#6366f1' },
  aurora: { name: 'Aurora', color: '#00d4aa' },
  midnight: { name: 'Midnight', color: '#6366f1' },
  forest: { name: 'Forest', color: '#4caf50' },
  'rose-gold': { name: 'Rose Gold', color: '#e91e63' },
  cyberpunk: { name: 'Cyberpunk', color: '#ff0080' },
  lavender: { name: 'Lavender', color: '#a855f7' },
  emerald: { name: 'Emerald', color: '#10b981' },
  coral: { name: 'Coral', color: '#ff6b6b' },
  steel: { name: 'Steel', color: '#6b7280' }
};

let currentTheme = 'dark';

function initializeThemeSelector() {
  const themeSelector = document.getElementById('themeSelector');
  const themeDropdown = document.getElementById('themeDropdown');
  const themeName = themeSelector?.querySelector('.theme-name');
  
  if (!themeSelector || !themeDropdown || !themeName) {
    console.error('Theme elements not found:', { themeSelector, themeDropdown, themeName });
    return;
  }
  
  console.log('Theme selector initialized successfully');
  
  // Check for saved theme preference or default to dark
  const savedTheme = localStorage.getItem('theme') || 'dark';
  currentTheme = savedTheme;
  
  applyTheme(currentTheme);
  updateThemeSelector();
  
  // Toggle dropdown
  themeSelector.addEventListener('click', (e) => {
    e.stopPropagation();
    console.log('Theme selector clicked');
    themeDropdown.classList.toggle('show');
    themeSelector.classList.toggle('active');
    console.log('Dropdown classes:', themeDropdown.classList.toString());
  });
  
  // Test: Make dropdown visible for debugging
  setTimeout(() => {
    console.log('Making dropdown visible for testing');
    themeDropdown.classList.add('show');
    themeSelector.classList.add('active');
  }, 2000);
  
  // Handle theme selection
  themeDropdown.addEventListener('click', (e) => {
    const themeOption = e.target.closest('.theme-option');
    if (themeOption) {
      const selectedTheme = themeOption.dataset.theme;
      currentTheme = selectedTheme;
      
      applyTheme(selectedTheme);
      updateThemeSelector();
      localStorage.setItem('theme', selectedTheme);
      
      // Close dropdown
      themeDropdown.classList.remove('show');
      themeSelector.classList.remove('active');
      
      // Add animation effect
      themeSelector.style.transform = 'scale(0.95)';
    setTimeout(() => {
        themeSelector.style.transform = 'scale(1)';
    }, 150);
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!themeSelector.contains(e.target) && !themeDropdown.contains(e.target)) {
      themeDropdown.classList.remove('show');
      themeSelector.classList.remove('active');
    }
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  
  // Add theme transition effect
  document.body.style.transition = 'all 0.5s ease';
  setTimeout(() => {
    document.body.style.transition = '';
  }, 500);
}

function updateThemeSelector() {
  const themeName = document.querySelector('.theme-name');
  if (themeName) {
    themeName.textContent = themes[currentTheme].name;
  }
}

// Profile dropdown functionality
function initializeProfileDropdown() {
  const profileToggle = document.getElementById('profileToggle');
  const profileMenu = document.getElementById('profileMenu');
  
  if (!profileToggle || !profileMenu) return;
  
  profileToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle('show');
    
    // Add rotation animation to arrow
    const arrow = profileToggle.querySelector('.profile-arrow');
    if (arrow) {
      arrow.style.transform = profileMenu.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0deg)';
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!profileToggle.contains(e.target) && !profileMenu.contains(e.target)) {
      profileMenu.classList.remove('show');
      const arrow = profileToggle.querySelector('.profile-arrow');
      if (arrow) {
        arrow.style.transform = 'rotate(0deg)';
      }
    }
  });
  
  // Handle profile menu item clicks
  profileMenu.addEventListener('click', (e) => {
    if (e.target.closest('.profile-item')) {
      const item = e.target.closest('.profile-item');
      const text = item.textContent.trim();
      
      if (text === 'Login') {
        // Redirect to login page
        window.location.href = 'login.html';
        profileMenu.classList.remove('show');
        const arrow = profileToggle.querySelector('.profile-arrow');
        if (arrow) {
          arrow.style.transform = 'rotate(0deg)';
        }
      } else if (text === 'Register') {
        // Redirect to register page
        window.location.href = 'register.html';
        profileMenu.classList.remove('show');
        const arrow = profileToggle.querySelector('.profile-arrow');
        if (arrow) {
          arrow.style.transform = 'rotate(0deg)';
        }
      } else if (text === 'Logout') {
        // Handle logout
        authToken = null;
        localStorage.removeItem('authToken');
        updateAuthUI();
        profileMenu.classList.remove('show');
        const arrow = profileToggle.querySelector('.profile-arrow');
        if (arrow) {
          arrow.style.transform = 'rotate(0deg)';
        }
        alert('Logged out successfully!');
      } else if (text === 'Profile' || text === 'Settings' || text === 'Analytics') {
        // Handle other menu items
        alert(`${text} functionality - Coming soon!`);
        profileMenu.classList.remove('show');
        const arrow = profileToggle.querySelector('.profile-arrow');
        if (arrow) {
          arrow.style.transform = 'rotate(0deg)';
        }
      }
    }
  });
}

// Mobile menu functionality
function initializeMobileMenu() {
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  
  if (!mobileMenuToggle || !mobileMenu) return;
  
  mobileMenuToggle.addEventListener('click', () => {
    mobileMenuToggle.classList.toggle('active');
    mobileMenu.classList.toggle('show');
    
    // Prevent body scroll when menu is open
    if (mobileMenu.classList.contains('show')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });
  
  // Close mobile menu when clicking on links
  mobileMenu.addEventListener('click', (e) => {
    if (e.target.closest('.mobile-nav-link')) {
      mobileMenuToggle.classList.remove('active');
      mobileMenu.classList.remove('show');
      document.body.style.overflow = '';
    }
  });
  
  // Handle mobile action buttons
  const mobileLoginBtn = document.getElementById('mobileLoginBtn');
  const mobileRegisterBtn = document.getElementById('mobileRegisterBtn');
  
  mobileLoginBtn?.addEventListener('click', () => {
    document.getElementById('loginModal').classList.remove('hidden');
    mobileMenuToggle.classList.remove('active');
    mobileMenu.classList.remove('show');
    document.body.style.overflow = '';
  });
  
  mobileRegisterBtn?.addEventListener('click', () => {
    document.getElementById('registerModal').classList.remove('hidden');
    mobileMenuToggle.classList.remove('active');
    mobileMenu.classList.remove('show');
    document.body.style.overflow = '';
  });
}

// Smooth scroll for navigation links
function initializeSmoothScroll() {
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const targetElement = document.querySelector(href);
        
        if (targetElement) {
          const offsetTop = targetElement.offsetTop - 80; // Account for navbar height
          
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      }
    });
  });
}

// Enhanced Notification System
let notifications = [
  { id: 1, title: 'Welcome to IdeaForge!', message: 'Start creating amazing pitches with our AI tools.', time: '2 min ago', read: false },
  { id: 2, title: 'New Feature Available', message: 'Try our enhanced mock interview system.', time: '1 hour ago', read: false },
  { id: 3, title: 'Profile Update', message: 'Complete your profile to unlock premium features.', time: '3 hours ago', read: true }
];

function initializeNotifications() {
  const notificationBtn = document.querySelector('.notification-btn');
  const notificationBadge = document.querySelector('.notification-badge');
  
  if (!notificationBtn || !notificationBadge) return;
  
  // Create notification panel
  const notificationPanel = createNotificationPanel();
  document.body.appendChild(notificationPanel);
  
  // Update badge count
  updateNotificationBadge();
  
  notificationBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // Toggle notification panel
    const isVisible = notificationPanel.classList.contains('show');
    if (isVisible) {
      hideNotificationPanel(notificationPanel);
    } else {
      showNotificationPanel(notificationPanel);
    }
    
    // Add animation
    notificationBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      notificationBtn.style.transform = 'scale(1)';
    }, 150);
  });
  
  // Close panel when clicking outside
  document.addEventListener('click', (e) => {
    if (!notificationBtn.contains(e.target) && !notificationPanel.contains(e.target)) {
      hideNotificationPanel(notificationPanel);
    }
  });
}

function createNotificationPanel() {
  const panel = document.createElement('div');
  panel.className = 'notification-panel';
  panel.innerHTML = `
    <div class="notification-header">
      <h3>Notifications</h3>
      <button class="mark-all-read">Mark all read</button>
    </div>
    <div class="notification-list">
      ${notifications.map(notification => `
        <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
          <div class="notification-content">
            <h4>${notification.title}</h4>
            <p>${notification.message}</p>
            <span class="notification-time">${notification.time}</span>
          </div>
          <button class="notification-close" data-id="${notification.id}">×</button>
        </div>
      `).join('')}
    </div>
  `;
  
  // Add event listeners
  panel.querySelector('.mark-all-read').addEventListener('click', () => {
    markAllAsRead();
    updateNotificationPanel(panel);
    updateNotificationBadge();
  });
  
  panel.querySelectorAll('.notification-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id);
      removeNotification(id);
      updateNotificationPanel(panel);
      updateNotificationBadge();
    });
  });
  
  return panel;
}

function showNotificationPanel(panel) {
  panel.classList.add('show');
  panel.style.animation = 'slideInDown 0.3s ease-out';
}

function hideNotificationPanel(panel) {
  panel.classList.remove('show');
  panel.style.animation = 'slideInUp 0.3s ease-out reverse';
}

function updateNotificationPanel(panel) {
  const list = panel.querySelector('.notification-list');
  list.innerHTML = notifications.map(notification => `
    <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
      <div class="notification-content">
        <h4>${notification.title}</h4>
        <p>${notification.message}</p>
        <span class="notification-time">${notification.time}</span>
      </div>
      <button class="notification-close" data-id="${notification.id}">×</button>
    </div>
  `).join('');
}

function updateNotificationBadge() {
  const badge = document.querySelector('.notification-badge');
  const unreadCount = notifications.filter(n => !n.read).length;
  
  if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

function markAllAsRead() {
  notifications.forEach(notification => {
    notification.read = true;
  });
}

function removeNotification(id) {
  notifications = notifications.filter(notification => notification.id !== id);
}

// Add notification panel styles
const notificationStyles = `
  .notification-panel {
    position: fixed;
    top: 80px;
    right: 20px;
    width: 350px;
    max-height: 500px;
    background: var(--bg-secondary);
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    box-shadow: 0 20px 40px var(--shadow-color);
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-20px);
    transition: all 0.3s ease;
  }
  
  .notification-panel.show {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
  
  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--glass-border);
  }
  
  .notification-header h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .mark-all-read {
    background: none;
    border: none;
    color: var(--accent-primary);
    font-size: 14px;
    cursor: pointer;
    transition: color 0.3s ease;
  }
  
  .mark-all-read:hover {
    color: var(--accent-secondary);
  }
  
  .notification-list {
    max-height: 400px;
    overflow-y: auto;
  }
  
  .notification-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px 20px;
    border-bottom: 1px solid var(--glass-border);
    transition: background-color 0.3s ease;
  }
  
  .notification-item:hover {
    background: var(--glass-bg);
  }
  
  .notification-item.unread {
    background: rgba(59, 130, 246, 0.05);
  }
  
  .notification-content h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
  }
  
  .notification-content p {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 8px;
    line-height: 1.4;
  }
  
  .notification-time {
    font-size: 12px;
    color: var(--text-muted);
  }
  
  .notification-close {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 18px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.3s ease;
  }
  
  .notification-close:hover {
    color: var(--text-primary);
    background: var(--glass-bg);
  }
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Enhanced logo animation
function initializeLogoAnimation() {
  const logoContainer = document.querySelector('.logo-container');
  
  if (!logoContainer) return;
  
  logoContainer.addEventListener('mouseenter', () => {
    // Add extra glow effect
    const logoIcon = logoContainer.querySelector('.logo-icon');
    if (logoIcon) {
      logoIcon.style.boxShadow = '0 0 30px rgba(102, 126, 234, 0.6)';
    }
  });
  
  logoContainer.addEventListener('mouseleave', () => {
    const logoIcon = logoContainer.querySelector('.logo-icon');
    if (logoIcon) {
      logoIcon.style.boxShadow = '';
    }
  });
}

// Navbar scroll effect
function initializeNavbarScrollEffect() {
  const navbar = document.querySelector('.navbar-glass');
  let lastScrollY = window.scrollY;
  
  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    
    if (navbar) {
      if (currentScrollY > 100) {
        navbar.style.background = 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(17, 24, 39, 0.9) 50%, rgba(17, 24, 39, 0.85) 100%)';
        navbar.style.backdropFilter = 'blur(25px) saturate(200%)';
      } else {
        navbar.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.02) 100%)';
        navbar.style.backdropFilter = 'blur(20px) saturate(180%)';
      }
    }
    
    lastScrollY = currentScrollY;
  });
}

// Initialize all navbar functionality
function initializeNavbar() {
  initializeSearch();
  initializeProfileDropdown();
  initializeMobileMenu();
  initializeSmoothScroll();
  initializeNotifications();
  initializeLogoAnimation();
  initializeNavbarScrollEffect();
}

// Quick Page Loader System
function initializePageLoader() {
  const pageLoader = document.getElementById('pageLoader');
  const video = document.getElementById('introvideo');
  
  if (!pageLoader) return;
  
  // Show loader immediately
  pageLoader.style.display = 'flex';
  
  // If video exists, let video handle the transition
  if (video) {
    return; // Video will handle the page transition
  }
  
  // Fallback: Quick loading simulation if no video
  let progress = 0;
  const progressBar = pageLoader.querySelector('.progress-bar');
  const loaderText = pageLoader.querySelector('.loader-text');
  
  const progressInterval = setInterval(() => {
    progress += Math.random() * 20 + 5; // 5-25% increments
    if (progress > 100) progress = 100;
    
    if (progressBar) {
      progressBar.style.width = progress + '%';
    }
    
    if (progress >= 100) {
      clearInterval(progressInterval);
      
      // Hide loader quickly
      setTimeout(() => {
        pageLoader.style.opacity = '0';
        setTimeout(() => {
          pageLoader.style.display = 'none';
          document.body.classList.remove('loading');
          triggerPageEntrance();
        }, 300);
      }, 200);
    }
  }, 50);
}

// Page entrance animations
function triggerPageEntrance() {
  // Remove loading class from body
  document.body.classList.remove('loading');
  
  // Animate navbar
  const navbar = document.querySelector('.navbar-container');
  if (navbar) {
    setTimeout(() => {
      navbar.classList.add('revealed');
    }, 200);
  }
  
  // Animate hero section
  const heroSection = document.querySelector('main section');
  if (heroSection) {
    setTimeout(() => {
      heroSection.classList.add('revealed');
    }, 400);
  }
  
  // Animate all content with reveal classes
  const revealElements = document.querySelectorAll('.text-reveal, .card-reveal, .button-reveal, .shape-reveal, .section-reveal');
  revealElements.forEach((element, index) => {
    setTimeout(() => {
      element.classList.add('revealed');
    }, 600 + (index * 100));
  });
  
  // Animate floating shapes with special timing
  const floatingShapes = document.querySelectorAll('.floating-shape');
  floatingShapes.forEach((shape, index) => {
    setTimeout(() => {
      shape.classList.add('revealed');
    }, 800 + (index * 200));
  });
  
  // Animate footer last
  const footer = document.querySelector('footer');
  if (footer) {
    setTimeout(() => {
      footer.classList.add('revealed');
    }, 2000);
  }
  
  // Add special loading animations to elements
  addLoadingAnimations();
}

// Add special loading animations
function addLoadingAnimations() {
  // Add wave animation to feature pills
  const featurePills = document.querySelectorAll('.feature-pill');
  featurePills.forEach((pill, index) => {
    setTimeout(() => {
      pill.classList.add('loading-wave');
    }, 1000 + (index * 200));
  });
  
  // Add pulse animation to tool cards
  const toolCards = document.querySelectorAll('.tool-card');
  toolCards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('loading-pulse');
    }, 1500 + (index * 150));
  });
  
  // Add bounce animation to buttons
  const buttons = document.querySelectorAll('.hero-btn');
  buttons.forEach((button, index) => {
    setTimeout(() => {
      button.classList.add('loading-bounce');
    }, 1200 + (index * 100));
  });
  
  // Add rotate animation to stats
  const statItems = document.querySelectorAll('.stat-item');
  statItems.forEach((stat, index) => {
    setTimeout(() => {
      stat.classList.add('loading-rotate');
    }, 1800 + (index * 200));
  });
}

// Enhanced Page Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Initialize page loader first
  initializePageLoader();
  
  // Initialize theme selector
  initializeThemeSelector();
  
  const chatBox = document.getElementById("chatBox");
  if (chatBox) {
    chatBox.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
        </div>
        <p class="text-gray-300 italic">AI: Welcome! I'm here to help you practice your interview skills. Let's begin with a simple question - tell me about yourself.</p>
      </div>
    `;
  }
  
  // Update auth UI based on stored token
  updateAuthUI();
  
  // Initialize all navbar functionality
  initializeNavbar();
  
  // Initialize scroll animations
  initializeScrollAnimations();
  
  // Initialize tool card animations
  initializeToolCardAnimations();
  
  // Initialize smooth scrolling for all links
  initializeSmoothScrolling();
  
  // Add loading states to buttons
  initializeLoadingStates();
  
  // Initialize scroll indicator
  initializeScrollIndicator();
});

// Scroll Indicator Functionality
function initializeScrollIndicator() {
  const scrollIndicator = document.querySelector('.scroll-indicator');
  
  if (!scrollIndicator) return;
  
  scrollIndicator.addEventListener('click', () => {
    const aiToolsSection = document.getElementById('ai-tools');
    if (aiToolsSection) {
      aiToolsSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
  
  // Hide scroll indicator when scrolled
  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      scrollIndicator.style.opacity = '0';
      scrollIndicator.style.pointerEvents = 'none';
    } else {
      scrollIndicator.style.opacity = '1';
      scrollIndicator.style.pointerEvents = 'auto';
    }
  });
}

// Scroll Animation System
function initializeScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);
  
  // Observe all sections and cards
  document.querySelectorAll('section, .tool-card, .glass').forEach(el => {
    observer.observe(el);
  });
}

// Tool Card Animation System
function initializeToolCardAnimations() {
  const toolCards = document.querySelectorAll('.tool-card');
  
  toolCards.forEach((card, index) => {
    card.style.setProperty('--i', index);
    
    // Add hover effects
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-8px) rotateX(5deg)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0) rotateX(0deg)';
    });
  });
}

// Enhanced Smooth Scrolling
function initializeSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      
      if (target) {
        const offsetTop = target.offsetTop - 80;
        
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
        
        // Add active state to navigation
        document.querySelectorAll('.nav-link').forEach(link => {
          link.classList.remove('active');
        });
        this.classList.add('active');
      }
    });
  });
}

// Loading States for Buttons
function initializeLoadingStates() {
  const buttons = document.querySelectorAll('button[id$="Btn"]');
  
  buttons.forEach(button => {
    button.addEventListener('click', function() {
      if (this.id === 'generateBtn' || this.id === 'sendBtn') {
        const originalText = this.innerHTML;
        this.innerHTML = `
          <div class="flex items-center gap-2">
            <div class="loading-spinner"></div>
            <span>Processing...</span>
          </div>
        `;
        this.disabled = true;
        
        // Simulate processing time
        setTimeout(() => {
          this.innerHTML = originalText;
          this.disabled = false;
        }, 2000);
      }
    });
  });
}

// Add CSS for new animations
const additionalStyles = `
  .animate-in {
    animation: slideInUp 0.8s ease-out both;
  }
  
  .nav-link.active {
    color: var(--accent-primary);
    background: rgba(59, 130, 246, 0.1);
  }
  
  .nav-link.active .nav-indicator {
    width: 80%;
  }
  
  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--glass-border);
    border-top: 2px solid var(--accent-primary);
    border-radius: 50%;
    animation: rotate 1s linear infinite;
  }
  
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .tool-card {
    animation-delay: calc(var(--i) * 0.2s);
  }
  
  .section-padding {
    padding: 80px 0;
  }
  
  .text-gradient {
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .glass-effect {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
  }
`;

// Inject additional styles
const additionalStyleSheet = document.createElement('style');
additionalStyleSheet.textContent = additionalStyles;
document.head.appendChild(additionalStyleSheet);
  
