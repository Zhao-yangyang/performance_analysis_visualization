// 数据处理器类
class DataProcessor {
    constructor(data) {
        this.data = data;
        this.subjects = this.getSubjects();
    }

    getSubjects() {
        if (this.data.length === 0) return [];
        const firstStudent = this.data[0];
        return Object.keys(firstStudent).filter(key => 
            key !== '姓名' && key !== 'name' && key !== '学生姓名'
        );
    }

    // 计算基本统计信息
    calculateBasicStats() {
        const stats = {};
        
        this.subjects.forEach(subject => {
            const scores = this.data.map(student => student[subject]);
            
            stats[subject] = {
                min: Math.min(...scores),
                max: Math.max(...scores),
                average: this.calculateAverage(scores),
                median: this.calculateMedian(scores),
                mode: this.calculateMode(scores),
                standardDeviation: this.calculateStandardDeviation(scores),
                variance: this.calculateVariance(scores)
            };
        });

        return stats;
    }

    // 计算平均值
    calculateAverage(scores) {
        const sum = scores.reduce((a, b) => a + b, 0);
        return (sum / scores.length).toFixed(2);
    }

    // 计算中位数
    calculateMedian(scores) {
        const sorted = [...scores].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2);
        } else {
            return sorted[mid].toFixed(2);
        }
    }

    // 计算众数
    calculateMode(scores) {
        const frequency = {};
        scores.forEach(score => {
            frequency[score] = (frequency[score] || 0) + 1;
        });
        
        let maxFreq = 0;
        let mode = null;
        
        for (const score in frequency) {
            if (frequency[score] > maxFreq) {
                maxFreq = frequency[score];
                mode = score;
            }
        }
        
        return mode;
    }

    // 计算标准差
    calculateStandardDeviation(scores) {
        const avg = parseFloat(this.calculateAverage(scores));
        const squaredDiffs = scores.map(score => Math.pow(score - avg, 2));
        const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / scores.length;
        return Math.sqrt(avgSquaredDiff).toFixed(2);
    }

    // 计算方差
    calculateVariance(scores) {
        const avg = parseFloat(this.calculateAverage(scores));
        const squaredDiffs = scores.map(score => Math.pow(score - avg, 2));
        return (squaredDiffs.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
    }

    // 计算等级分布
    calculateGradeDistribution() {
        const distribution = {
            'A (90-100)': 0,
            'B (80-89)': 0,
            'C (70-79)': 0,
            'D (60-69)': 0,
            'F (<60)': 0
        };

        this.data.forEach(student => {
            this.subjects.forEach(subject => {
                const score = student[subject];
                if (score >= 90) distribution['A (90-100)']++;
                else if (score >= 80) distribution['B (80-89)']++;
                else if (score >= 70) distribution['C (70-79)']++;
                else if (score >= 60) distribution['D (60-69)']++;
                else distribution['F (<60)']++;
            });
        });

        return distribution;
    }

    // 计算学生排名
    calculateStudentRankings() {
        const studentsWithTotals = this.data.map(student => {
            const studentName = student['姓名'] || student['name'] || student['学生姓名'];
            const total = this.subjects.reduce((sum, subject) => sum + student[subject], 0);
            const average = (total / this.subjects.length).toFixed(1);
            
            return {
                name: studentName,
                total: total,
                average: parseFloat(average),
                ...student
            };
        });

        // 按总分排序
        studentsWithTotals.sort((a, b) => b.total - a.total);

        // 添加排名
        studentsWithTotals.forEach((student, index) => {
            student.rank = index + 1;
        });

        return studentsWithTotals;
    }

    // 分析学科相关性
    calculateSubjectCorrelation() {
        const correlations = {};
        
        for (let i = 0; i < this.subjects.length; i++) {
            for (let j = i + 1; j < this.subjects.length; j++) {
                const subject1 = this.subjects[i];
                const subject2 = this.subjects[j];
                
                const scores1 = this.data.map(student => student[subject1]);
                const scores2 = this.data.map(student => student[subject2]);
                
                const correlation = this.calculateCorrelationCoefficient(scores1, scores2);
                correlations[`${subject1}-${subject2}`] = correlation;
            }
        }
        
        return correlations;
    }

    // 计算相关系数
    calculateCorrelationCoefficient(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return denominator === 0 ? 0 : (numerator / denominator).toFixed(3);
    }

    // 分析学习能力
    analyzeStudentPerformance() {
        const rankings = this.calculateStudentRankings();
        const stats = this.calculateBasicStats();
        
        const analysis = rankings.map(student => {
            const strengths = [];
            const weaknesses = [];
            
            this.subjects.forEach(subject => {
                const score = student[subject];
                const subjectAvg = parseFloat(stats[subject].average);
                
                if (score >= subjectAvg + 10) {
                    strengths.push(subject);
                } else if (score <= subjectAvg - 10) {
                    weaknesses.push(subject);
                }
            });
            
            return {
                ...student,
                strengths: strengths,
                weaknesses: weaknesses,
                isHighPerformer: student.average >= 85,
                needsAttention: student.average < 70
            };
        });
        
        return analysis;
    }

    // 生成班级报告
    generateClassReport() {
        const stats = this.calculateBasicStats();
        const distribution = this.calculateGradeDistribution();
        const rankings = this.calculateStudentRankings();
        const correlations = this.calculateSubjectCorrelation();
        
        const totalStudents = this.data.length;
        const totalScores = rankings.map(s => s.total);
        const classAverage = this.calculateAverage(totalScores);
        
        const highPerformers = rankings.filter(s => s.average >= 85).length;
        const lowPerformers = rankings.filter(s => s.average < 60).length;
        
        return {
            overview: {
                totalStudents: totalStudents,
                classAverage: classAverage,
                highPerformers: highPerformers,
                lowPerformers: lowPerformers,
                passRate: ((totalStudents - lowPerformers) / totalStudents * 100).toFixed(1)
            },
            subjectStats: stats,
            gradeDistribution: distribution,
            topPerformers: rankings.slice(0, 5),
            bottomPerformers: rankings.slice(-5),
            correlations: correlations
        };
    }

    // 生成个人报告
    generateStudentReport(studentName) {
        const student = this.data.find(s => 
            (s['姓名'] || s['name'] || s['学生姓名']) === studentName
        );
        
        if (!student) return null;
        
        const rankings = this.calculateStudentRankings();
        const studentRanking = rankings.find(s => s.name === studentName);
        const stats = this.calculateBasicStats();
        
        const report = {
            student: student,
            ranking: studentRanking,
            subjectAnalysis: {},
            recommendations: []
        };
        
        // 分析各科目表现
        this.subjects.forEach(subject => {
            const score = student[subject];
            const subjectStats = stats[subject];
            const percentile = this.calculatePercentile(score, subject);
            
            report.subjectAnalysis[subject] = {
                score: score,
                average: subjectStats.average,
                percentile: percentile,
                performance: this.getPerformanceLevel(score, subjectStats.average)
            };
            
            // 生成建议
            if (score < parseFloat(subjectStats.average) - 10) {
                report.recommendations.push(`需要加强${subject}的学习，当前成绩低于班级平均水平`);
            }
        });
        
        return report;
    }

    // 计算百分位数
    calculatePercentile(score, subject) {
        const allScores = this.data.map(student => student[subject]);
        const sortedScores = allScores.sort((a, b) => a - b);
        const rank = sortedScores.indexOf(score) + 1;
        return ((rank / sortedScores.length) * 100).toFixed(0);
    }

    // 获取表现水平
    getPerformanceLevel(score, average) {
        const avg = parseFloat(average);
        if (score >= avg + 15) return '优秀';
        if (score >= avg + 5) return '良好';
        if (score >= avg - 5) return '一般';
        return '需要提高';
    }

    // 生成总结统计
    generateSummary() {
        const report = this.generateClassReport();
        const stats = this.calculateBasicStats();
        
        // 找出最高分和最低分科目
        let highestSubject = '';
        let lowestSubject = '';
        let highestAvg = 0;
        let lowestAvg = 100;
        
        this.subjects.forEach(subject => {
            const avg = parseFloat(stats[subject].average);
            if (avg > highestAvg) {
                highestAvg = avg;
                highestSubject = subject;
            }
            if (avg < lowestAvg) {
                lowestAvg = avg;
                lowestSubject = subject;
            }
        });
        
        return {
            studentCount: {
                label: '学生总数',
                value: this.data.length
            },
            classAverage: {
                label: '班级平均分',
                value: report.overview.classAverage
            },
            passRate: {
                label: '及格率',
                value: report.overview.passRate + '%'
            },
            highPerformers: {
                label: '优秀学生数',
                value: report.overview.highPerformers
            },
            highestSubject: {
                label: '最佳科目',
                value: `${highestSubject} (${highestAvg.toFixed(1)})`
            },
            lowestSubject: {
                label: '薄弱科目',
                value: `${lowestSubject} (${lowestAvg.toFixed(1)})`
            },
            topStudent: {
                label: '第一名',
                value: report.topPerformers[0].name
            },
            scoreRange: {
                label: '分数区间',
                value: `${Math.min(...report.topPerformers.concat(report.bottomPerformers).map(s => s.total))} - ${Math.max(...report.topPerformers.concat(report.bottomPerformers).map(s => s.total))}`
            }
        };
    }

    // 导出数据为CSV格式
    exportToCSV() {
        if (this.data.length === 0) return '';
        
        const headers = Object.keys(this.data[0]);
        const csvHeaders = headers.join(',') + ',总分,平均分,排名\n';
        
        const rankings = this.calculateStudentRankings();
        const csvRows = rankings.map(student => {
            const row = headers.map(header => student[header]).join(',');
            return `${row},${student.total},${student.average},${student.rank}`;
        }).join('\n');
        
        return csvHeaders + csvRows;
    }

    // 数据验证
    validateData() {
        const errors = [];
        
        if (this.data.length === 0) {
            errors.push('数据为空');
            return errors;
        }
        
        this.data.forEach((student, index) => {
            const studentName = student['姓名'] || student['name'] || student['学生姓名'];
            
            if (!studentName || studentName.trim() === '') {
                errors.push(`第${index + 1}行：学生姓名为空`);
            }
            
            this.subjects.forEach(subject => {
                const score = student[subject];
                if (isNaN(score) || score < 0 || score > 100) {
                    errors.push(`第${index + 1}行：${subject}成绩无效 (${score})`);
                }
            });
        });
        
        return errors;
    }
} 