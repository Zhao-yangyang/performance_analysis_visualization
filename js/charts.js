// 图表管理器类
class ChartManager {
    constructor(data) {
        this.data = data;
        this.subjects = this.getSubjects();
        this.colors = {
            primary: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'],
            secondary: ['#a8edea', '#fed6e3', '#ffecd2', '#fcb69f', '#ffeaa7', '#fab1a0'],
            gradients: [
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
            ]
        };
    }

    getSubjects() {
        if (this.data.length === 0) return [];
        const firstStudent = this.data[0];
        return Object.keys(firstStudent).filter(key => 
            !['姓名', 'name', '学生姓名', 'Name', 'NAME', '学生'].includes(key)
        );
    }

    // 创建柱状图 - 各科目平均分
    createBarChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const averages = this.subjects.map(subject => {
            const total = this.data.reduce((sum, student) => sum + student[subject], 0);
            return (total / this.data.length).toFixed(1);
        });

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.subjects,
                datasets: [{
                    label: '平均分',
                    data: averages,
                    backgroundColor: this.colors.primary.slice(0, this.subjects.length),
                    borderColor: this.colors.primary.slice(0, this.subjects.length).map(color => color + 'CC'),
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '各科目平均分对比',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 10
                        },
                        title: {
                            display: true,
                            text: '分数'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '科目'
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutBounce'
                }
            }
        });
    }

    // 创建折线图 - 学生成绩趋势
    createLineChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const datasets = this.data.slice(0, 6).map((student, index) => {
            const studentName = student['姓名'] || student['name'] || student['学生姓名'];
            const scores = this.subjects.map(subject => student[subject]);
            
            return {
                label: studentName,
                data: scores,
                borderColor: this.colors.primary[index % this.colors.primary.length],
                backgroundColor: this.colors.primary[index % this.colors.primary.length] + '20',
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: this.colors.primary[index % this.colors.primary.length],
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            };
        });

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.subjects,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '学生成绩趋势对比（前6名学生）',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            color: '#333'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 10
                        },
                        title: {
                            display: true,
                            text: '分数'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '科目'
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    // 创建饼图 - 成绩等级分布
    createPieChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const grades = { 'A (90-100)': 0, 'B (80-89)': 0, 'C (70-79)': 0, 'D (60-69)': 0, 'F (<60)': 0 };
        
        this.data.forEach(student => {
            this.subjects.forEach(subject => {
                const score = student[subject];
                if (score >= 90) grades['A (90-100)']++;
                else if (score >= 80) grades['B (80-89)']++;
                else if (score >= 70) grades['C (70-79)']++;
                else if (score >= 60) grades['D (60-69)']++;
                else grades['F (<60)']++;
            });
        });

        const labels = Object.keys(grades);
        const data = Object.values(grades);

        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: this.colors.primary,
                    borderColor: '#fff',
                    borderWidth: 3,
                    hoverBorderWidth: 4,
                    hoverBorderColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '成绩等级分布',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            color: '#333'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed * 100) / total).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '50%',
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 2000
                }
            }
        });
    }

    // 创建雷达图 - 综合能力分析
    createRadarChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // 计算各科目平均分
        const averages = this.subjects.map(subject => {
            const total = this.data.reduce((sum, student) => sum + student[subject], 0);
            return (total / this.data.length).toFixed(1);
        });

        // 找出前3名学生（按总分）
        const studentsWithTotals = this.data.map(student => {
            const studentName = student['姓名'] || student['name'] || student['学生姓名'];
            const total = this.subjects.reduce((sum, subject) => sum + student[subject], 0);
            return { ...student, name: studentName, total };
        }).sort((a, b) => b.total - a.total).slice(0, 3);

        const studentDataSets = studentsWithTotals.map((student, index) => {
            const studentName = student.name;
            return {
                label: studentName,
                data: this.subjects.map(subject => student[subject]),
                borderColor: this.colors.primary[index + 1 % this.colors.primary.length],
                backgroundColor: this.colors.primary[index + 1 % this.colors.primary.length] + '33',
                pointBackgroundColor: this.colors.primary[index + 1 % this.colors.primary.length],
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: this.colors.primary[index + 1 % this.colors.primary.length]
            };
        });

        return new Chart(ctx, {
            type: 'radar',
            data: {
                labels: this.subjects,
                datasets: [
                    {
                        label: '班级平均',
                        data: averages,
                        borderColor: this.colors.primary[0],
                        backgroundColor: this.colors.primary[0] + '33',
                        pointBackgroundColor: this.colors.primary[0],
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: this.colors.primary[0]
                    },
                    ...studentDataSets
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '综合能力雷达图 (前3名 vs 班级平均)',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            color: '#333'
                        }
                    }
                },
                scales: {
                    r: {
                        angleLines: { display: true },
                        suggestedMin: 0,
                        suggestedMax: 100,
                        pointLabels: {
                            font: {
                                size: 13
                            }
                        },
                        ticks: {
                            stepSize: 20
                        }
                    }
                },
                elements: {
                    line: {
                        borderWidth: 3
                    }
                }
            }
        });
    }

    // 创建散点图 - 学科相关性分析
    createScatterChart(canvasId, subjectX, subjectY) {
        console.log('createScatterChart被调用，canvasId:', canvasId);
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Canvas元素不存在:', canvasId);
            return null;
        }
        
        const ctx = canvas.getContext('2d');
        console.log('获取到canvas context:', ctx);
        
        // 如果科目少于2个，显示提示信息
        if (this.subjects.length < 2) {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('至少需要2个科目才能进行相关性分析', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return null;
        }
        
        // 计算所有科目两两之间的相关性系数
        const correlationData = [];
        const labels = [];
        
        for (let i = 0; i < this.subjects.length; i++) {
            for (let j = i + 1; j < this.subjects.length; j++) {
                const subjectA = this.subjects[i];
                const subjectB = this.subjects[j];
                
                const scoresA = this.data.map(student => student[subjectA]);
                const scoresB = this.data.map(student => student[subjectB]);
                
                const correlation = this.calculateCorrelation(scoresA, scoresB);
                
                correlationData.push({
                    x: i,
                    y: j,
                    correlation: correlation,
                    label: `${subjectA} vs ${subjectB}`
                });
                
                labels.push(`${subjectA}-${subjectB}`);
            }
        }
        
        console.log('相关性数据:', correlationData);

        // 创建相关性柱状图
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '相关性系数',
                    data: correlationData.map(d => d.correlation),
                    backgroundColor: correlationData.map(d => {
                        const abs = Math.abs(d.correlation);
                        if (abs >= 0.7) return '#e74c3c'; // 强相关 - 红色
                        if (abs >= 0.5) return '#f39c12'; // 中等相关 - 橙色
                        if (abs >= 0.3) return '#f1c40f'; // 弱相关 - 黄色
                        return '#95a5a6'; // 很弱相关 - 灰色
                    }),
                    borderColor: '#2c3e50',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '科目相关性分析矩阵',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const correlation = context.parsed.y;
                                let strength = '';
                                const abs = Math.abs(correlation);
                                if (abs >= 0.7) strength = '强相关';
                                else if (abs >= 0.5) strength = '中等相关';
                                else if (abs >= 0.3) strength = '弱相关';
                                else strength = '很弱相关';
                                
                                return `相关性: ${correlation.toFixed(3)} (${strength})`;
                            },
                            afterLabel: function(context) {
                                return context.parsed.y > 0 ? '正相关：成绩同向变化' : '负相关：成绩反向变化';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '科目组合'
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '相关性系数'
                        },
                        min: -1,
                        max: 1,
                        ticks: {
                            stepSize: 0.2,
                            callback: function(value) {
                                return value.toFixed(1);
                            }
                        }
                    }
                }
            }
        });
    }

    // 计算相关性系数的辅助方法
    calculateCorrelation(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return denominator === 0 ? 0 : parseFloat((numerator / denominator).toFixed(3));
    }

    // 创建混合图表 - 成绩分布与平均线
    createMixedChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const averages = this.subjects.map(subject => {
            const total = this.data.reduce((sum, student) => sum + student[subject], 0);
            return (total / this.data.length).toFixed(1);
        });

        const maxScores = this.subjects.map(subject => {
            return Math.max(...this.data.map(student => student[subject]));
        });

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.subjects,
                datasets: [
                    {
                        type: 'bar',
                        label: '平均分',
                        data: averages,
                        backgroundColor: this.colors.primary[0] + '60',
                        borderColor: this.colors.primary[0],
                        borderWidth: 2,
                        yAxisID: 'y'
                    },
                    {
                        type: 'line',
                        label: '最高分',
                        data: maxScores,
                        borderColor: this.colors.primary[1],
                        backgroundColor: this.colors.primary[1] + '20',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '平均分与最高分对比',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '科目'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '分数'
                        }
                    }
                }
            }
        });
    }

    // 新增：创建箱线图 - 分数分布分析
    createBoxChart(canvasId) {
        console.log('createBoxChart被调用，canvasId:', canvasId);
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Canvas元素不存在:', canvasId);
            return null;
        }
        
        const ctx = canvas.getContext('2d');
        console.log('获取到canvas context:', ctx);
        
        // 由于Chart.js原生不支持箱线图，我们用分组柱状图模拟
        const statistics = this.subjects.map(subject => {
            const scores = this.data.map(student => student[subject]).sort((a, b) => a - b);
            const min = Math.min(...scores);
            const max = Math.max(...scores);
            const q1 = scores[Math.floor(scores.length * 0.25)];
            const median = scores[Math.floor(scores.length * 0.5)];
            const q3 = scores[Math.floor(scores.length * 0.75)];
            const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            
            return { min, q1, median, q3, max, mean };
        });

        console.log('箱线图统计数据:', statistics);

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.subjects,
                datasets: [
                    {
                        label: '最小值',
                        data: statistics.map(s => s.min),
                        backgroundColor: this.colors.primary[0] + '40',
                        borderColor: this.colors.primary[0],
                        borderWidth: 1
                    },
                    {
                        label: '第一四分位数',
                        data: statistics.map(s => s.q1),
                        backgroundColor: this.colors.primary[1] + '40',
                        borderColor: this.colors.primary[1],
                        borderWidth: 1
                    },
                    {
                        label: '中位数',
                        data: statistics.map(s => s.median),
                        backgroundColor: this.colors.primary[2] + '60',
                        borderColor: this.colors.primary[2],
                        borderWidth: 2
                    },
                    {
                        label: '第三四分位数',
                        data: statistics.map(s => s.q3),
                        backgroundColor: this.colors.primary[3] + '40',
                        borderColor: this.colors.primary[3],
                        borderWidth: 1
                    },
                    {
                        label: '最大值',
                        data: statistics.map(s => s.max),
                        backgroundColor: this.colors.primary[4] + '40',
                        borderColor: this.colors.primary[4],
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '各科目分数分布统计',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '科目'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '分数'
                        }
                    }
                }
            }
        });
    }

    // 新增：创建堆积柱状图 - 成绩段分布
    createStackedBarChart(canvasId) {
        console.log('createStackedBarChart被调用，canvasId:', canvasId);
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Canvas元素不存在:', canvasId);
            return null;
        }
        
        const ctx = canvas.getContext('2d');
        console.log('获取到canvas context:', ctx);
        
        const gradeRanges = {
            'A级 (90-100)': this.subjects.map(() => 0),
            'B级 (80-89)': this.subjects.map(() => 0),
            'C级 (70-79)': this.subjects.map(() => 0),
            'D级 (60-69)': this.subjects.map(() => 0),
            'F级 (<60)': this.subjects.map(() => 0)
        };

        this.data.forEach(student => {
            this.subjects.forEach((subject, index) => {
                const score = student[subject];
                if (score >= 90) gradeRanges['A级 (90-100)'][index]++;
                else if (score >= 80) gradeRanges['B级 (80-89)'][index]++;
                else if (score >= 70) gradeRanges['C级 (70-79)'][index]++;
                else if (score >= 60) gradeRanges['D级 (60-69)'][index]++;
                else gradeRanges['F级 (<60)'][index]++;
            });
        });

        const datasets = Object.keys(gradeRanges).map((grade, index) => ({
            label: grade,
            data: gradeRanges[grade],
            backgroundColor: this.colors.primary[index % this.colors.primary.length],
            borderColor: this.colors.primary[index % this.colors.primary.length],
            borderWidth: 1
        }));

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.subjects,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '各科目成绩等级分布',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '科目'
                        },
                        stacked: true
                    },
                    y: {
                        title: {
                            display: true,
                            text: '学生人数'
                        },
                        stacked: true,
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // 新增：创建热力图 - 成绩矩阵（用柱状图模拟）
    createHeatmapChart(canvasId) {
        console.log('createHeatmapChart被调用，canvasId:', canvasId);
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Canvas元素不存在:', canvasId);
            return null;
        }
        
        const ctx = canvas.getContext('2d');
        console.log('获取到canvas context:', ctx);
        
        // 计算每个学生的总分并排序
        const studentsWithTotal = this.data.map(student => {
            const name = student['姓名'] || student['name'] || student['学生姓名'];
            const total = this.subjects.reduce((sum, subject) => sum + student[subject], 0);
            return { name, total, ...student };
        }).sort((a, b) => b.total - a.total).slice(0, 10); // 取前10名

        // 为每个科目创建数据集
        const datasets = this.subjects.map((subject, index) => ({
            label: subject,
            data: studentsWithTotal.map(student => student[subject]),
            backgroundColor: this.colors.primary[index % this.colors.primary.length] + '80',
            borderColor: this.colors.primary[index % this.colors.primary.length],
            borderWidth: 1
        }));

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: studentsWithTotal.map(student => student.name),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '前10名学生各科成绩矩阵',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '学生'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '分数'
                        }
                    }
                },
                indexAxis: 'x'
            }
        });
    }
} 