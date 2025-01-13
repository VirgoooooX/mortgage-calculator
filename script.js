// 工具函数：格式化金额
function formatMoney(amount) {
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY'
    }).format(amount);
}

// 工具函数：格式化日期
function formatDate(date) {
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long'
    });
}

// 计算等额本息月供
function calculateEqualInstallment(principal, annualRate, months) {
    const monthlyRate = annualRate / 12 / 100;
    const monthlyPayment = principal * monthlyRate * Math.pow(1 + monthlyRate, months) 
        / (Math.pow(1 + monthlyRate, months) - 1);
    return monthlyPayment;
}

// 计算等额本金月供
function calculateEqualPrincipal(principal, annualRate, months, currentMonth) {
    const monthlyPrincipal = principal / months;
    const monthlyRate = annualRate / 12 / 100;
    const remainingPrincipal = principal - (monthlyPrincipal * currentMonth);
    return monthlyPrincipal + remainingPrincipal * monthlyRate;
}

// 初始化日期选择器
function initializeDatePickers() {
    const currentYear = new Date().getFullYear();
    
    // 获取所有日期选择器元素
    const startYear = document.getElementById('startYear');
    const startMonth = document.getElementById('startMonth');
    const prepayYear = document.getElementById('prepayYear');
    const prepayMonth = document.getElementById('prepayMonth');
    const startInput = document.getElementById('startDate');
    const prepayInput = document.getElementById('prepayDate');

    // 生成年份选项（前后30年）
    for (let year = currentYear - 30; year <= currentYear + 30; year++) {
        startYear.add(new Option(year + '年', year));
        prepayYear.add(new Option(year + '年', year));
    }

    // 生成月份选项
    for (let month = 1; month <= 12; month++) {
        const monthStr = month.toString().padStart(2, '0');
        startMonth.add(new Option(monthStr + '月', monthStr));
        prepayMonth.add(new Option(monthStr + '月', monthStr));
    }

    // 设置默认值为当前年月
    const now = new Date();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    
    startYear.value = currentYear;
    startMonth.value = currentMonth;
    prepayYear.value = currentYear;
    prepayMonth.value = currentMonth;
    
    startInput.value = `${currentYear}${currentMonth}`;
    prepayInput.value = `${currentYear}${currentMonth}`;

    // 下拉框改变时更新输入框
    function updateInput(yearSelect, monthSelect, input) {
        const year = yearSelect.value;
        const month = monthSelect.value;
        input.value = `${year}${month}`;
    }

    // 输入框输入时更新下拉框
    function updateSelects(input, yearSelect, monthSelect) {
        const value = input.value.replace(/\D/g, '');
        if (value.length === 6) {
            const year = value.substring(0, 4);
            const month = value.substring(4, 6);
            if (yearSelect.querySelector(`option[value="${year}"]`) && 
                monthSelect.querySelector(`option[value="${month}"]`)) {
                yearSelect.value = year;
                monthSelect.value = month;
                input.classList.remove('invalid');
            } else {
                input.classList.add('invalid');
            }
        } else {
            input.classList.add('invalid');
        }
    }

    // 添加事件监听
    startYear.addEventListener('change', () => updateInput(startYear, startMonth, startInput));
    startMonth.addEventListener('change', () => updateInput(startYear, startMonth, startInput));
    prepayYear.addEventListener('change', () => updateInput(prepayYear, prepayMonth, prepayInput));
    prepayMonth.addEventListener('change', () => updateInput(prepayYear, prepayMonth, prepayInput));

    startInput.addEventListener('input', () => updateSelects(startInput, startYear, startMonth));
    prepayInput.addEventListener('input', () => updateSelects(prepayInput, prepayYear, prepayMonth));
}

// 获取日期对象
function getDateFromInput(inputId) {
    const input = document.getElementById(inputId);
    const value = input.value.replace(/\D/g, '');
    if (value.length === 6) {
        const year = parseInt(value.substring(0, 4));
        const month = parseInt(value.substring(4, 6)) - 1;
        return new Date(year, month);
    }
    return null;
}

// 计算提前还款后的新还款计划
function calculatePrepayment() {
    // 获取输入值
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) * 10000; // 转换为元
    const loanYears = parseFloat(document.getElementById('loanYears').value);
    const interestRate = parseFloat(document.getElementById('interestRate').value);
    const startDate = getDateFromInput('startDate');
    const prepayDate = getDateFromInput('prepayDate');
    const prepayAmount = parseFloat(document.getElementById('prepayAmount').value) * 10000; // 转换为元
    const paymentMethod = document.getElementById('paymentMethod').value;
    const prepaymentMethod = document.getElementById('prepaymentMethod').value;

    // 验证输入
    if (!loanAmount || !loanYears || !interestRate || !startDate || !prepayDate || !prepayAmount) {
        alert('请填写完整的贷款信息！');
        return;
    }

    // 计算已还款月数
    const paidMonths = Math.floor((prepayDate - startDate) / (1000 * 60 * 60 * 24 * 30.44));
    const totalMonths = loanYears * 12;
    const remainingMonths = totalMonths - paidMonths;

    // 计算原始月供和总利息
    let originalMonthlyPayment = 0;
    let originalTotalInterest = 0;
    
    if (paymentMethod === 'equalInstallment') {
        originalMonthlyPayment = calculateEqualInstallment(loanAmount, interestRate, totalMonths);
        originalTotalInterest = originalMonthlyPayment * totalMonths - loanAmount;
    } else {
        originalMonthlyPayment = calculateEqualPrincipal(loanAmount, interestRate, totalMonths, 0);
        let remainingPrincipal = loanAmount;
        const monthlyPrincipal = loanAmount / totalMonths;
        const monthlyRate = interestRate / 12 / 100;
        
        for (let i = 0; i < totalMonths; i++) {
            originalTotalInterest += remainingPrincipal * monthlyRate;
            remainingPrincipal -= monthlyPrincipal;
        }
    }

    // 计算已还利息（从开始到提前还款时）
    let paidInterest = 0;
    if (paymentMethod === 'equalInstallment') {
        const monthlyRate = interestRate / 12 / 100;
        let remainingPrincipal = loanAmount;
        for (let i = 0; i < paidMonths; i++) {
            const interest = remainingPrincipal * monthlyRate;
            paidInterest += interest;
            const principal = originalMonthlyPayment - interest;
            remainingPrincipal -= principal;
        }
    } else {
        // 等额本金的已还利息
        const monthlyPrincipal = loanAmount / totalMonths;
        const monthlyRate = interestRate / 12 / 100;
        let remainingPrincipal = loanAmount;
        for (let i = 0; i < paidMonths; i++) {
            paidInterest += remainingPrincipal * monthlyRate;
            remainingPrincipal -= monthlyPrincipal;
        }
    }

    // 计算剩余本金（扣除已还本金和提前还款金额）
    const paidPrincipal = paymentMethod === 'equalInstallment' ? 
        (originalMonthlyPayment * paidMonths - paidInterest) : 
        (loanAmount / totalMonths * paidMonths);
    const remainingPrincipal = loanAmount - paidPrincipal - prepayAmount;

    // 计算新的还款情况
    let newRemainingInterest = 0;
    let newMonthlyPayment = 0;
    let newRemainingMonths = 0;

    // 计算新的还款期限和结束时间
    let newEndDate = new Date(prepayDate); // 从提前还款时间开始计算

    if (prepaymentMethod === 'reducePeriod') {
        if (paymentMethod === 'equalInstallment') {
            // 等额本息的新剩余月数计算
            const monthlyRate = interestRate / 12 / 100;
            // 用原月供计算新的还款期限
            newRemainingMonths = Math.ceil(
                Math.log(originalMonthlyPayment / (originalMonthlyPayment - remainingPrincipal * monthlyRate)) / 
                Math.log(1 + monthlyRate)
            );
        } else {
            // 等额本金的新剩余月数计算
            newRemainingMonths = Math.ceil(remainingPrincipal / (loanAmount / totalMonths));
        }
        // 新的结束时间 = 提前还款时间 + 新的剩余月数
        newEndDate.setMonth(prepayDate.getMonth() + newRemainingMonths);
    } else {
        // 减少月供的情况
        newRemainingMonths = remainingMonths;
        // 新的结束时间 = 原始结束时间（保持不变）
        newEndDate = new Date(originalEndDate);
    }

    if (paymentMethod === 'equalInstallment') {
        newMonthlyPayment = originalMonthlyPayment;
        const monthlyRate = interestRate / 12 / 100;
        let tempPrincipal = remainingPrincipal;
        for (let i = 0; i < newRemainingMonths; i++) {
            const interest = tempPrincipal * monthlyRate;
            newRemainingInterest += interest;
            const principal = originalMonthlyPayment - interest;
            tempPrincipal -= principal;
        }
    } else {
        // 等额本金
        const monthlyRate = interestRate / 12 / 100;
        const newMonthlyPrincipal = remainingPrincipal / newRemainingMonths;
        let tempPrincipal = remainingPrincipal;
        for (let i = 0; i < newRemainingMonths; i++) {
            newRemainingInterest += tempPrincipal * monthlyRate;
            tempPrincipal -= newMonthlyPrincipal;
        }
        newMonthlyPayment = newMonthlyPrincipal + remainingPrincipal * monthlyRate;
    }

    // 总利息 = 已还利息 + 剩余贷款的新利息
    const newTotalInterest = paidInterest + newRemainingInterest;

    // 设置原始结束日期
    let originalEndDate = new Date(startDate);
    originalEndDate.setMonth(startDate.getMonth() + totalMonths);

    // 更新显示结果
    document.getElementById('originalInterest').textContent = formatMoney(originalTotalInterest);
    document.getElementById('newInterest').textContent = formatMoney(newTotalInterest);
    document.getElementById('savedInterest').textContent = formatMoney(originalTotalInterest - newTotalInterest);
    
    document.getElementById('originalMonthly').textContent = formatMoney(originalMonthlyPayment);
    document.getElementById('newMonthly').textContent = formatMoney(newMonthlyPayment);
    document.getElementById('monthlyDiff').textContent = formatMoney(originalMonthlyPayment - newMonthlyPayment);
    
    document.getElementById('originalEndDate').textContent = formatDate(originalEndDate);
    document.getElementById('newEndDate').textContent = formatDate(newEndDate);
    document.getElementById('monthsDiff').textContent = 
        prepaymentMethod === 'reducePeriod' ? 
        `减少${totalMonths - (paidMonths + newRemainingMonths)}个月` : 
        '期限不变';

    // 在计算完成后保存历史记录
    saveToHistory();
}

// 更新对比图表
function updateChart(originalInterest, newInterest) {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    
    if (window.myChart) {
        window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['原始利息', '提前还款后利息'],
            datasets: [{
                label: '利息对比',
                data: [originalInterest, newInterest],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(75, 192, 192, 0.5)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatMoney(value);
                        }
                    }
                }
            }
        }
    });
}

// 添加事件监听
document.getElementById('calculate').addEventListener('click', calculatePrepayment); 

// 页面加载时初始化日期选择器
document.addEventListener('DOMContentLoaded', initializeDatePickers); 

// 历史记录相关函数
function saveToHistory(calculationResult) {
    // 获取当前时间
    const timestamp = new Date().toLocaleString();
    
    // 创建历史记录对象
    const historyItem = {
        timestamp,
        loanAmount: document.getElementById('loanAmount').value,
        loanYears: document.getElementById('loanYears').value,
        interestRate: document.getElementById('interestRate').value,
        startDate: document.getElementById('startDate').value,
        prepayDate: document.getElementById('prepayDate').value,
        prepayAmount: document.getElementById('prepayAmount').value,
        paymentMethod: document.getElementById('paymentMethod').value,
        prepaymentMethod: document.getElementById('prepaymentMethod').value,
        result: {
            originalInterest: document.getElementById('originalInterest').textContent,
            newInterest: document.getElementById('newInterest').textContent,
            savedInterest: document.getElementById('savedInterest').textContent,
            originalMonthly: document.getElementById('originalMonthly').textContent,
            newMonthly: document.getElementById('newMonthly').textContent,
            monthlyDiff: document.getElementById('monthlyDiff').textContent,
            originalEndDate: document.getElementById('originalEndDate').textContent,
            newEndDate: document.getElementById('newEndDate').textContent,
            monthsDiff: document.getElementById('monthsDiff').textContent
        }
    };

    // 获取现有历史记录
    let history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
    
    // 添加新记录到开头
    history.unshift(historyItem);
    
    // 限制历史记录数量（比如最多保存10条）
    if (history.length > 10) {
        history = history.slice(0, 10);
    }
    
    // 保存到本地存储
    localStorage.setItem('calculationHistory', JSON.stringify(history));
    
    // 更新显示
    updateHistoryDisplay();
}

// 更新历史记录显示
function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    const history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
    
    historyList.innerHTML = history.map((item, index) => `
        <div class="history-item" onclick="loadHistoryItem(${index})">
            <button class="delete-btn" onclick="deleteHistoryItem(event, ${index})">
                <i class="fas fa-times"></i>
            </button>
            <div class="history-item-header">
                <span>${item.timestamp}</span>
            </div>
            <div class="history-item-content">
                <div class="history-item-row">
                    <span class="history-item-label">贷款金额:</span>
                    <span>${item.loanAmount}万元</span>
                </div>
                <div class="history-item-row">
                    <span class="history-item-label">节省利息:</span>
                    <span>${item.result.savedInterest}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// 添加删除历史记录项的函数
function deleteHistoryItem(event, index) {
    event.stopPropagation(); // 阻止事件冒泡，防止触发点击历史记录项的事件
    
    let history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
    history.splice(index, 1);
    localStorage.setItem('calculationHistory', JSON.stringify(history));
    
    updateHistoryDisplay();
}

// 加载历史记录项
function loadHistoryItem(index) {
    const history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
    const item = history[index];
    
    // 填充表单
    document.getElementById('loanAmount').value = item.loanAmount;
    document.getElementById('loanYears').value = item.loanYears;
    document.getElementById('interestRate').value = item.interestRate;
    document.getElementById('startDate').value = item.startDate;
    document.getElementById('prepayDate').value = item.prepayDate;
    document.getElementById('prepayAmount').value = item.prepayAmount;
    document.getElementById('paymentMethod').value = item.paymentMethod;
    document.getElementById('prepaymentMethod').value = item.prepaymentMethod;
    
    // 更新结果显示
    document.getElementById('originalInterest').textContent = item.result.originalInterest;
    document.getElementById('newInterest').textContent = item.result.newInterest;
    document.getElementById('savedInterest').textContent = item.result.savedInterest;
    document.getElementById('originalMonthly').textContent = item.result.originalMonthly;
    document.getElementById('newMonthly').textContent = item.result.newMonthly;
    document.getElementById('monthlyDiff').textContent = item.result.monthlyDiff;
    document.getElementById('originalEndDate').textContent = item.result.originalEndDate;
    document.getElementById('newEndDate').textContent = item.result.newEndDate;
    document.getElementById('monthsDiff').textContent = item.result.monthsDiff;
    
    // 高亮选中的历史记录
    const historyItems = document.querySelectorAll('.history-item');
    historyItems.forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
}

// 页面加载时显示历史记录
document.addEventListener('DOMContentLoaded', () => {
    updateHistoryDisplay();
}); 