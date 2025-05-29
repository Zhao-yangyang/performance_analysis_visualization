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
            
            // 计算每个科目的等级
            const subjectGrades = {};
            this.subjects.forEach(subject => {
                const score = student[subject];
                subjectGrades[subject] = this.getGradeLevel(score);
            });
            
            return {
                name: studentName,
                total: total,
                average: parseFloat(average),
                subjectGrades: subjectGrades,
                ...student
            };
        });

        // 按总分排序
        studentsWithTotals.sort((a, b) => b.total - a.total);

        // 添加排名和奖牌
        studentsWithTotals.forEach((student, index) => {
            student.rank = index + 1;
            if (index === 0) student.medal = '🥇';
            else if (index === 1) student.medal = '🥈';
            else if (index === 2) student.medal = '🥉';
        });

        return studentsWithTotals;
    }

    // 获取成绩等级
    getGradeLevel(score) {
        if (score >= 90) return 'A';
        else if (score >= 80) return 'B';
        else if (score >= 70) return 'C';
        else if (score >= 60) return 'D';
        else return 'F';
    }

    // 计算各科目详细统计（新增方法）
    calculateSubjectDetailedStats() {
        const subjectStats = {};
        
        this.subjects.forEach(subject => {
            const scores = this.data.map(student => student[subject]);
            const totalStudents = scores.length;
            
            // 基本统计
            const min = Math.min(...scores);
            const max = Math.max(...scores);
            const sum = scores.reduce((a, b) => a + b, 0);
            const average = (sum / totalStudents).toFixed(2);
            
            // 各等级人数统计
            let excellent = 0; // 优秀(90-100)
            let good = 0;      // 良好(80-89)
            let pass = 0;      // 及格(60-79)
            let fail = 0;      // 不及格(<60)
            
            scores.forEach(score => {
                if (score >= 90) excellent++;
                else if (score >= 80) good++;
                else if (score >= 60) pass++;
                else fail++;
            });
            
            // 计算各等级率
            const excellentRate = ((excellent / totalStudents) * 100).toFixed(1);
            const goodRate = ((good / totalStudents) * 100).toFixed(1);
            const passRate = (((excellent + good + pass) / totalStudents) * 100).toFixed(1);
            const failRate = ((fail / totalStudents) * 100).toFixed(1);
            
            // 找出该科目的最高分和最低分学生
            const maxScoreStudent = this.data.find(student => student[subject] === max);
            const minScoreStudent = this.data.find(student => student[subject] === min);
            
            subjectStats[subject] = {
                min: min,
                max: max,
                average: parseFloat(average),
                totalStudents: totalStudents,
                excellent: {
                    count: excellent,
                    rate: parseFloat(excellentRate)
                },
                good: {
                    count: good,
                    rate: parseFloat(goodRate)
                },
                pass: {
                    count: pass,
                    rate: parseFloat(passRate)
                },
                fail: {
                    count: fail,
                    rate: parseFloat(failRate)
                },
                passRate: parseFloat(passRate), // 总及格率
                maxScoreStudent: maxScoreStudent['姓名'] || maxScoreStudent['name'] || maxScoreStudent['学生姓名'],
                minScoreStudent: minScoreStudent['姓名'] || minScoreStudent['name'] || minScoreStudent['学生姓名'],
                standardDeviation: this.calculateStandardDeviation(scores),
                median: this.calculateMedian(scores)
            };
        });
        
        return subjectStats;
    }

    // 生成科目排名（新增方法）
    generateSubjectRankings() {
        const subjectRankings = {};
        
        this.subjects.forEach(subject => {
            const studentsWithScores = this.data.map(student => {
                const studentName = student['姓名'] || student['name'] || student['学生姓名'];
                return {
                    name: studentName,
                    score: student[subject],
                    grade: this.getGradeLevel(student[subject])
                };
            });
            
            // 按该科目分数排序
            studentsWithScores.sort((a, b) => b.score - a.score);
            
            // 添加排名和奖牌
            studentsWithScores.forEach((student, index) => {
                student.rank = index + 1;
                if (index === 0) student.medal = '🥇';
                else if (index === 1) student.medal = '🥈';
                else if (index === 2) student.medal = '🥉';
            });
            
            subjectRankings[subject] = studentsWithScores;
        });
        
        return subjectRankings;
    }

    // 生成学生个人详细报告（新增方法）
    generateStudentDetailedReport() {
        const rankings = this.calculateStudentRankings();
        const subjectStats = this.calculateSubjectDetailedStats();
        
        const detailedReports = rankings.map(student => {
            const subjectPerformance = {};
            
            this.subjects.forEach(subject => {
                const score = student[subject];
                const subjectAvg = subjectStats[subject].average;
                const percentile = this.calculatePercentile(score, subject);
                
                subjectPerformance[subject] = {
                    score: score,
                    grade: this.getGradeLevel(score),
                    percentile: percentile,
                    aboveAverage: score > subjectAvg,
                    difference: (score - subjectAvg).toFixed(1),
                    rank: this.getSubjectRank(student.name, subject)
                };
            });
            
            return {
                ...student,
                subjectPerformance: subjectPerformance,
                strengths: this.getStudentStrengths(student),
                weaknesses: this.getStudentWeaknesses(student),
                recommendedFocus: this.getRecommendedFocus(student)
            };
        });
        
        return detailedReports;
    }

    // 获取学生在某科目的排名
    getSubjectRank(studentName, subject) {
        const subjectRankings = this.generateSubjectRankings();
        const studentRank = subjectRankings[subject].find(s => s.name === studentName);
        return studentRank ? studentRank.rank : null;
    }

    // 获取学生优势科目
    getStudentStrengths(student) {
        const strengths = [];
        this.subjects.forEach(subject => {
            const score = student[subject];
            if (score >= 85) {
                strengths.push({
                    subject: subject,
                    score: score,
                    grade: this.getGradeLevel(score)
                });
            }
        });
        return strengths.sort((a, b) => b.score - a.score);
    }

    // 获取学生薄弱科目
    getStudentWeaknesses(student) {
        const weaknesses = [];
        this.subjects.forEach(subject => {
            const score = student[subject];
            if (score < 70) {
                weaknesses.push({
                    subject: subject,
                    score: score,
                    grade: this.getGradeLevel(score)
                });
            }
        });
        return weaknesses.sort((a, b) => a.score - b.score);
    }

    // 获取推荐关注点
    getRecommendedFocus(student) {
        const recommendations = [];
        const weaknesses = this.getStudentWeaknesses(student);
        
        if (weaknesses.length > 0) {
            recommendations.push(`建议重点关注：${weaknesses.map(w => w.subject).join('、')}`);
        }
        
        if (student.average >= 90) {
            recommendations.push('整体表现优异，保持当前学习状态');
        } else if (student.average >= 80) {
            recommendations.push('成绩良好，可适当提高薄弱科目');
        } else if (student.average >= 60) {
            recommendations.push('需要加强基础知识学习');
        } else {
            recommendations.push('需要全面提升各科成绩');
        }
        
        return recommendations;
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