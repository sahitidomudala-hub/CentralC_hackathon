// Gig-Fin - Main Application Logic

// Data Store
const DataStore = {
    business: [],
    personal: [],
    nextId: 1,

    init() {
        const savedData = localStorage.getItem('gigFinData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.business = data.business || [];
            this.personal = data.personal || [];
            this.nextId = data.nextId || 1;
        }
    },

    save() {
        const data = {
            business: this.business,
            personal: this.personal,
            nextId: this.nextId
        };
        localStorage.setItem('gigFinData', JSON.stringify(data));
    },

    addEntry(category, entry) {
        const newEntry = {
            id: this.nextId++,
            ...entry
        };
        this[category].push(newEntry);
        this.save();
        return newEntry;
    },

    updateEntry(category, id, updates) {
        const index = this[category].findIndex(entry => entry.id === id);
        if (index !== -1) {
            this[category][index] = { ...this[category][index], ...updates };
            this.save();
            return this[category][index];
        }
        return null;
    },

    deleteEntry(category, id) {
        const index = this[category].findIndex(entry => entry.id === id);
        if (index !== -1) {
            const deleted = this[category].splice(index, 1);
            this.save();
            return deleted[0];
        }
        return null;
    },

    getEntries(category) {
        return [...this[category]].sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    calculateTotals(category) {
        const entries = this[category];
        const income = entries
            .filter(e => e.type === 'income')
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const expense = entries
            .filter(e => e.type === 'expense')
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);
        return { income, expense, net: income - expense };
    }
};

// Utility Functions
const Utils = {
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    },

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }
};

// UI Controller
const UI = {
    currentPage: 'dashboard',

    init() {
        this.bindNavigation();
        this.bindForms();
        this.bindModal();
        this.bindDashboardCards();
        this.bindInvoicePreview();
        DataStore.init();
        this.renderAll();
    },

    bindNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
    },

    bindDashboardCards() {
        const cards = document.querySelectorAll('.dashboard-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const page = card.dataset.page;
                this.navigateTo(page);
            });
        });
    },

    navigateTo(page) {
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Update pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        document.getElementById(page).classList.add('active');

        this.currentPage = page;

        // Update charts if on trends page
        if (page === 'trends') {
            setTimeout(() => Charts.updateAll(), 100);
        }
    },

    bindForms() {
        // Business form
        document.getElementById('business-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const entry = {
                date: document.getElementById('business-date').value,
                amount: parseFloat(document.getElementById('business-amount').value),
                type: document.getElementById('business-type').value,
                description: document.getElementById('business-description').value
            };
            DataStore.addEntry('business', entry);
            this.renderBusiness();
            this.updateDashboard();
            this.showToast('Entry added successfully!', 'success');
            e.target.reset();
            document.getElementById('business-date').value = Utils.getTodayDate();
        });

        // Personal form
        document.getElementById('personal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const entry = {
                date: document.getElementById('personal-date').value,
                amount: parseFloat(document.getElementById('personal-amount').value),
                type: document.getElementById('personal-type').value,
                description: document.getElementById('personal-description').value
            };
            DataStore.addEntry('personal', entry);
            this.renderPersonal();
            this.updateDashboard();
            this.showToast('Entry added successfully!', 'success');
            e.target.reset();
            document.getElementById('personal-date').value = Utils.getTodayDate();
        });

        // Set default dates
        document.getElementById('business-date').value = Utils.getTodayDate();
        document.getElementById('personal-date').value = Utils.getTodayDate();
        document.getElementById('invoice-date').value = Utils.getTodayDate();
    },

    bindModal() {
        const modal = document.getElementById('edit-modal');
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.modal-cancel');

        closeBtn.addEventListener('click', () => this.closeModal());
        cancelBtn.addEventListener('click', () => this.closeModal());

        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        document.getElementById('edit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEdit();
        });
    },

    openEditModal(category, id) {
        const entry = DataStore[category].find(e => e.id === id);
        if (!entry) return;

        document.getElementById('edit-id').value = id;
        document.getElementById('edit-category').value = category;
        document.getElementById('edit-date').value = entry.date;
        document.getElementById('edit-amount').value = entry.amount;
        document.getElementById('edit-type').value = entry.type;
        document.getElementById('edit-description').value = entry.description;

        document.getElementById('edit-modal').classList.add('active');
    },

    closeModal() {
        document.getElementById('edit-modal').classList.remove('active');
    },

    saveEdit() {
        const id = parseInt(document.getElementById('edit-id').value);
        const category = document.getElementById('edit-category').value;

        const updates = {
            date: document.getElementById('edit-date').value,
            amount: parseFloat(document.getElementById('edit-amount').value),
            type: document.getElementById('edit-type').value,
            description: document.getElementById('edit-description').value
        };

        DataStore.updateEntry(category, id, updates);
        this.closeModal();
        this.renderAll();
        this.showToast('Entry updated successfully!', 'success');
    },

    deleteEntry(category, id) {
        if (confirm('Are you sure you want to delete this entry?')) {
            DataStore.deleteEntry(category, id);
            this.renderAll();
            this.showToast('Entry deleted successfully!', 'success');
        }
    },

    bindInvoicePreview() {
        const inputs = ['invoice-number', 'invoice-date', 'client-name', 'service-description', 'invoice-amount', 'your-name'];
        inputs.forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.updateInvoicePreview());
        });
    },

    updateInvoicePreview() {
        document.getElementById('preview-invoice-number').textContent = document.getElementById('invoice-number').value || 'INV-000';
        document.getElementById('preview-date').textContent = document.getElementById('invoice-date').value || new Date().toLocaleDateString();
        document.getElementById('preview-client').textContent = document.getElementById('client-name').value || 'Client Name';
        document.getElementById('preview-service').textContent = document.getElementById('service-description').value || 'Service description...';
        document.getElementById('preview-amount').textContent = Utils.formatCurrency(parseFloat(document.getElementById('invoice-amount').value) || 0);
    },

    renderAll() {
        this.renderDashboard();
        this.renderBusiness();
        this.renderPersonal();
    },

    renderDashboard() {
        const businessTotals = DataStore.calculateTotals('business');
        const personalTotals = DataStore.calculateTotals('personal');

        // Dashboard cards
        document.getElementById('dashboard-business-profit').textContent = Utils.formatCurrency(businessTotals.net);
        document.getElementById('dashboard-personal-balance').textContent = Utils.formatCurrency(personalTotals.net);

        // Quick stats
        document.getElementById('stat-business-income').textContent = Utils.formatCurrency(businessTotals.income);
        document.getElementById('stat-business-expense').textContent = Utils.formatCurrency(businessTotals.expense);
        document.getElementById('stat-personal-income').textContent = Utils.formatCurrency(personalTotals.income);
        document.getElementById('stat-personal-expense').textContent = Utils.formatCurrency(personalTotals.expense);
    },

    updateDashboard() {
        this.renderDashboard();
    },

    renderBusiness() {
        const tbody = document.querySelector('#business-table tbody');
        const entries = DataStore.getEntries('business');
        const totals = DataStore.calculateTotals('business');

        // Update net profit
        document.getElementById('business-net-profit').textContent = Utils.formatCurrency(totals.net);
        document.getElementById('business-net-profit').className = 'summary-value ' + (totals.net >= 0 ? 'positive' : 'negative');

        if (entries.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <p>No entries yet. Add your first income or expense!</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = entries.map(entry => `
            <tr>
                <td>${Utils.formatDate(entry.date)}</td>
                <td><span class="type-badge ${entry.type}">${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}</span></td>
                <td>${entry.description}</td>
                <td class="amount-cell ${entry.type}">${Utils.formatCurrency(entry.amount)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-secondary btn-small" onclick="UI.openEditModal('business', ${entry.id})">Edit</button>
                        <button class="btn btn-danger btn-small" onclick="UI.deleteEntry('business', ${entry.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    renderPersonal() {
        const tbody = document.querySelector('#personal-table tbody');
        const entries = DataStore.getEntries('personal');
        const totals = DataStore.calculateTotals('personal');

        // Update net balance
        document.getElementById('personal-net-balance').textContent = Utils.formatCurrency(totals.net);
        document.getElementById('personal-net-balance').className = 'summary-value ' + (totals.net >= 0 ? 'positive' : 'negative');

        if (entries.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <p>No entries yet. Add your first income or expense!</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = entries.map(entry => `
            <tr>
                <td>${Utils.formatDate(entry.date)}</td>
                <td><span class="type-badge ${entry.type}">${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}</span></td>
                <td>${entry.description}</td>
                <td class="amount-cell ${entry.type}">${Utils.formatCurrency(entry.amount)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-secondary btn-small" onclick="UI.openEditModal('personal', ${entry.id})">Edit</button>
                        <button class="btn btn-danger btn-small" onclick="UI.deleteEntry('personal', ${entry.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast ' + type;
        toast.classList.add('active');

        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});

// Make UI globally accessible for onclick handlers
window.UI = UI;

