import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, History, TrendingUp, Calendar, Activity, Award, Clock, Hand, Zap, Brain, Edit2, X, Check, Download, Upload, LogOut } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { auth, db, loginWithGoogle, logout } from './firebase';

const App = () => {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) {
      setRecords([]);
      return;
    }

    const q = query(collection(db, `users/${user.uid}/records`), orderBy('id', 'asc'));
    const unsubscribeData = onSnapshot(q, (snapshot) => {
      const fetchedRecords = snapshot.docs.map(doc => doc.data());
      setRecords(fetchedRecords);
    }, (error) => {
      console.error("Firestore Error:", error);
    });

    return () => unsubscribeData();
  }, [user, isAuthReady]);

  const [leftValue, setLeftValue] = useState('');
  const [rightValue, setRightValue] = useState('');
  const [fatigue, setFatigue] = useState(3); // 默认中等
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());

  // 编辑状态
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ left: '', right: '', fatigue: 3 });

  const fileInputRef = useRef(null);

  const exportData = () => {
    const dataStr = JSON.stringify(records, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grip_strength_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') return;
        
        const importedRecords = JSON.parse(result);
        if (Array.isArray(importedRecords)) {
          let addedCount = 0;
          for (const ir of importedRecords) {
            if (!records.find(r => r.id === ir.id)) {
              const recordToSave = {
                ...ir,
                uid: user.uid,
                createdAt: ir.createdAt || new Date().toISOString()
              };
              await setDoc(doc(db, `users/${user.uid}/records`, ir.id.toString()), recordToSave);
              addedCount++;
            }
          }
          alert(`成功导入并合并了 ${addedCount} 条新记录！`);
        } else {
          alert('文件格式不正确，请选择有效的备份文件。');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('读取文件失败，请确保是有效的 JSON 备份文件。');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // 定义疲劳等级及其样式属性
  const fatigueLevels = useMemo(() => [
    { 
      level: 1, 
      label: '极佳', 
      emoji: '🤩', 
      theme: 'from-green-400 to-emerald-500', 
      shadow: 'shadow-green-200', 
      bg: 'bg-green-50',
      textColor: 'text-green-600',
      dotColor: 'bg-green-500'
    },
    { 
      level: 2, 
      label: '良好', 
      emoji: '😊', 
      theme: 'from-emerald-400 to-teal-500', 
      shadow: 'shadow-emerald-200', 
      bg: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      dotColor: 'bg-emerald-500'
    },
    { 
      level: 3, 
      label: '一般', 
      emoji: '😐', 
      theme: 'from-amber-400 to-orange-500', 
      shadow: 'shadow-amber-200', 
      bg: 'bg-amber-50',
      textColor: 'text-amber-600',
      dotColor: 'bg-amber-500'
    },
    { 
      level: 4, 
      label: '疲劳', 
      emoji: '😫', 
      theme: 'from-orange-400 to-red-500', 
      shadow: 'shadow-orange-200', 
      bg: 'bg-orange-50',
      textColor: 'text-orange-600',
      dotColor: 'bg-orange-500'
    },
    { 
      level: 5, 
      label: '极累', 
      emoji: '💀', 
      theme: 'from-red-500 to-rose-700', 
      shadow: 'shadow-red-200', 
      bg: 'bg-red-50',
      textColor: 'text-red-600',
      dotColor: 'bg-red-500'
    },
  ], []);

  // 辅助函数：安全获取疲劳等级配置
  const getFatigueConfig = (level) => {
    return fatigueLevels.find(l => l.level === level) || fatigueLevels[2];
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const addRecord = async (e) => {
    e.preventDefault();
    if (!leftValue && !rightValue) return; // 允许只填一只手
    if (!user) return;

    const now = new Date();
    const id = Date.now();
    const newRecord = {
      id,
      uid: user.uid,
      date: `${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`,
      time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      left: leftValue ? parseFloat(leftValue) : null,
      right: rightValue ? parseFloat(rightValue) : null,
      fatigue: fatigue,
      createdAt: now.toISOString()
    };

    try {
      await setDoc(doc(db, `users/${user.uid}/records`, id.toString()), newRecord);
      setLeftValue('');
      setRightValue('');
      setFatigue(3);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("保存失败，请重试");
    }
  };

  const deleteRecord = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/records`, id.toString()));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const startEdit = (record) => {
    setEditingId(record.id);
    setEditForm({
      left: record.left !== null ? record.left.toString() : '',
      right: record.right !== null ? record.right.toString() : '',
      fatigue: record.fatigue
    });
  };

  const saveEdit = async (id) => {
    if (!editForm.left && !editForm.right) {
      alert("至少需要填写一只手的数据");
      return;
    }
    if (!user) return;

    const recordToEdit = records.find(r => r.id === id);
    if (!recordToEdit) return;

    const updatedRecord = {
      ...recordToEdit,
      left: editForm.left ? parseFloat(editForm.left) : null,
      right: editForm.right ? parseFloat(editForm.right) : null,
      fatigue: editForm.fatigue
    };

    try {
      await setDoc(doc(db, `users/${user.uid}/records`, id.toString()), updatedRecord);
      setEditingId(null);
    } catch (error) {
      console.error("Error updating document: ", error);
      alert("更新失败，请重试");
    }
  };

  const stats = useMemo(() => {
    if (records.length === 0) return { maxL: 0, maxR: 0, avgFatigue: 0 };
    const lefts = records.map(r => r.left).filter(v => v !== null);
    const rights = records.map(r => r.right).filter(v => v !== null);
    const maxL = lefts.length ? Math.max(...lefts) : 0;
    const maxR = rights.length ? Math.max(...rights) : 0;
    const avgFatigue = (records.reduce((a, b) => a + b.fatigue, 0) / records.length).toFixed(1);
    return { maxL, maxR, avgFatigue };
  }, [records]);

  // 趋势图组件（带交互查看功能和左右滑动）
  const LineChart = ({ data }) => {
    const [activeIndex, setActiveIndex] = useState(null);
    const scrollRef = useRef(null);
    
    // 当数据更新时，自动滚动到最右侧（最新数据）
    useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
      }
    }, [data]);

    if (data.length < 2) return (
      <div className="h-40 flex items-center justify-center text-slate-400 text-sm italic">
        需要至少两条记录来生成趋势图
      </div>
    );

    // 动态计算宽度以支持横向滚动
    const minPointWidth = 55;
    const width = Math.max(300, data.length * minPointWidth);
    const height = 180;
    const padding = 25;
    const bottomPadding = 40; // 为底部的日期和时间标签留出空间
    
    const gripValues = data.flatMap(d => [d.left, d.right]).filter(v => v !== null);
    const minGrip = gripValues.length ? Math.min(...gripValues) : 0;
    const maxGrip = gripValues.length ? Math.max(...gripValues) : 10;
    const gripRange = maxGrip - minGrip || 10;

    const getX = (i) => (i / (data.length - 1)) * (width - padding * 2) + padding;
    const getY = (val) => height - bottomPadding - ((val - (minGrip - 5)) / (gripRange + 10)) * (height - padding - bottomPadding);
    const getFatigueY = (f) => {
        const normalized = (5 - f) / 4; 
        return height - bottomPadding - (normalized * (height - padding - bottomPadding));
    };

    // 生成路径，处理 null 值（断点）
    const createPath = (key, isFatigue = false) => {
      let path = '';
      let isFirst = true;
      data.forEach((d, i) => {
        if (d[key] === null && !isFatigue) {
          isFirst = true;
          return;
        }
        const x = getX(i);
        const y = isFatigue ? getFatigueY(d[key]) : getY(d[key]);
        if (isFirst) {
          path += `M ${x} ${y} `;
          isFirst = false;
        } else {
          path += `L ${x} ${y} `;
        }
      });
      return path;
    };

    const activePoint = activeIndex !== null ? data[activeIndex] : null;

    return (
      <div className="w-full relative group">
        <div ref={scrollRef} className="w-full overflow-x-auto no-scrollbar pb-2" style={{ scrollBehavior: 'smooth' }}>
          <svg 
            viewBox={`0 0 ${width} ${height}`} 
            className="h-auto drop-shadow-xl"
            style={{ width: `${width}px`, minWidth: '100%' }}
            onClick={() => setActiveIndex(null)}
          >
            {/* 网格线 */}
            <line x1={padding} y1={padding} x2={padding} y2={height-bottomPadding} stroke="#f1f5f9" strokeWidth="1" />
            <line x1={padding} y1={height-bottomPadding} x2={width-padding} y2={height-bottomPadding} stroke="#f1f5f9" strokeWidth="1" />
            
            {/* 疲劳区域 */}
            <path d={`${createPath('fatigue', true)} L ${getX(data.length-1)} ${height-bottomPadding} L ${getX(0)} ${height-bottomPadding} Z`} fill="rgba(245, 158, 11, 0.03)" stroke="none" />

            {/* 数据线 */}
            <path d={createPath('left')} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d={createPath('right')} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d={createPath('fatigue', true)} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2" strokeLinecap="round" opacity="0.6" />
            
            {/* 指示线 */}
            {activeIndex !== null && (
              <line 
                x1={getX(activeIndex)} y1={padding} x2={getX(activeIndex)} y2={height-bottomPadding} 
                stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 2"
              />
            )}

            {/* 数据点和X轴标签 */}
            {data.map((d, i) => (
              <React.Fragment key={i}>
                {d.left !== null && <circle cx={getX(i)} cy={getY(d.left)} r={activeIndex === i ? "4" : "3"} fill="#3b82f6" stroke="white" strokeWidth="1" />}
                {d.right !== null && <circle cx={getX(i)} cy={getY(d.right)} r={activeIndex === i ? "4" : "3"} fill="#8b5cf6" stroke="white" strokeWidth="1" />}
                <circle cx={getX(i)} cy={getFatigueY(d.fatigue)} r="2" fill="#f59e0b" />
                
                {/* X轴时间标签 */}
                <text x={getX(i)} y={height - 20} fontSize="9" fill="#94a3b8" textAnchor="middle" fontWeight="bold">{d.date}</text>
                <text x={getX(i)} y={height - 8} fontSize="8" fill="#cbd5e1" textAnchor="middle">{d.time || '00:00'}</text>

                {/* 点击感应区 (透明大按钮) */}
                <rect 
                  x={getX(i) - (width/data.length)/2} 
                  y="0" 
                  width={width/data.length} 
                  height={height} 
                  fill="transparent" 
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex(i);
                  }}
                />
              </React.Fragment>
            ))}
          </svg>
        </div>

        {/* 交互提示框 (Tooltip) */}
        {activeIndex !== null && activePoint && (
          <div 
            className="absolute top-0 pointer-events-none transition-all duration-300 ease-out z-10"
            style={{ 
              // 确保提示框不会超出屏幕边界
              left: `max(60px, min(calc(100% - 60px), ${(getX(activeIndex) / width) * 100}%))`, 
              transform: `translateX(-50%) translateY(-100%)`,
              marginTop: '-10px'
            }}
          >
            <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-2xl shadow-2xl min-w-[120px]">
              <div className="text-[10px] font-black text-slate-400 mb-2 uppercase flex justify-between items-center gap-2">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {activePoint.date} {activePoint.time || ''}</span>
                <span className="text-amber-500 text-sm">{getFatigueConfig(activePoint.fatigue).emoji}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[10px] font-bold text-blue-600">左手</span>
                  {activePoint.left !== null ? (
                    <span className="font-black text-sm">{activePoint.left}<span className="text-[8px] ml-0.5">kg</span></span>
                  ) : (
                    <span className="font-black text-sm text-slate-300">-</span>
                  )}
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[10px] font-bold text-purple-600">右手</span>
                  {activePoint.right !== null ? (
                    <span className="font-black text-sm">{activePoint.right}<span className="text-[8px] ml-0.5">kg</span></span>
                  ) : (
                    <span className="font-black text-sm text-slate-300">-</span>
                  )}
                </div>
              </div>
            </div>
            {/* 提示框下的小箭头 */}
            <div className="w-2 h-2 bg-white/95 rotate-45 border-r border-b border-slate-200 mx-auto -mt-1 shadow-sm"></div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 px-2 mt-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
           <div className="flex items-center gap-1.5"><div className="w-2 h-0.5 bg-blue-500 rounded-full"></div> 左手</div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-0.5 bg-purple-500 rounded-full"></div> 右手</div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-0.5 border-t border-dashed border-amber-500"></div> 疲劳</div>
        </div>
      </div>
    );
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 selection:bg-blue-100">
        <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-100/30 blur-[120px] rounded-full -z-10"></div>
        <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-100/30 blur-[120px] rounded-full -z-10"></div>
        
        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl border border-slate-100 flex items-center justify-center mb-8">
          <Activity className="w-10 h-10 text-blue-500" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-800 mb-2 text-center">力量记录</h1>
        <p className="text-slate-500 font-medium mb-12 text-center max-w-xs">连接云端数据库，您的握力数据将永久保存，永不丢失。</p>
        
        <button 
          onClick={loginWithGoogle}
          className="flex items-center gap-3 bg-white px-8 py-4 rounded-full shadow-xl shadow-slate-200/50 border border-slate-100 hover:scale-105 active:scale-95 transition-all"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="font-black text-slate-700">使用 Google 账号登录</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100 pb-20">
      <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-100/30 blur-[120px] rounded-full -z-10"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-100/30 blur-[120px] rounded-full -z-10"></div>

      <header className="px-6 pt-10 pb-4 max-w-lg mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">力量记录</h1>
          <p className="text-slate-400 text-xs font-bold mt-1 flex items-center gap-1 capitalize">
            <Calendar className="w-3 h-3" />
            {currentTime.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={logout} className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center gap-1">
            <LogOut className="w-3 h-3" /> 退出
          </button>
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden">
            {user.photoURL ? (
              <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Activity className="w-6 h-6 text-blue-500" />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-6">
        
        {activeTab === 'dashboard' ? (
          <div className="space-y-6 animate-in fade-in duration-700 slide-in-from-bottom-2">
            
            <section className="bg-white/60 backdrop-blur-3xl border border-white p-7 rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-visible">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black flex items-center gap-2 text-slate-800">
                  <Plus className="w-4 h-4 text-blue-500" /> 开启新记录
                </h3>
                <div className="px-2 py-1 bg-blue-50 text-[10px] font-black text-blue-600 rounded-lg uppercase tracking-wider">Today</div>
              </div>
              
              <form onSubmit={addRecord} className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2 group">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 ml-1">
                      <Hand className="w-3 h-3 transform -scale-x-100" /> 左手 (kg)
                    </div>
                    <input 
                      type="number" step="0.1" value={leftValue} onChange={e => setLeftValue(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-5 px-2 text-center text-3xl font-black outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all shadow-inner"
                      placeholder="-"
                    />
                  </div>
                  <div className="flex-1 space-y-2 group">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 ml-1">
                      <Hand className="w-3 h-3" /> 右手 (kg)
                    </div>
                    <input 
                      type="number" step="0.1" value={rightValue} onChange={e => setRightValue(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-5 px-2 text-center text-3xl font-black outline-none focus:ring-4 focus:ring-purple-500/10 focus:bg-white transition-all shadow-inner"
                      placeholder="-"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                   <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 ml-1">
                      <Zap className="w-3 h-3 text-amber-500 animate-pulse" /> 身体状态感知
                   </div>
                   <div className="flex justify-between gap-2 px-1 py-6">
                      {fatigueLevels.map((lvl) => (
                        <button
                          key={lvl.level}
                          type="button"
                          onClick={() => setFatigue(lvl.level)}
                          className={`flex-1 flex flex-col items-center py-4 rounded-[1.5rem] transition-all duration-500 relative ${
                            fatigue === lvl.level 
                            ? `bg-white border-white ${lvl.shadow} shadow-2xl scale-110 -translate-y-1 z-10` 
                            : 'bg-slate-50/40 border-transparent opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                          } border`}
                        >
                          {fatigue === lvl.level && (
                            <div className={`absolute inset-0 bg-gradient-to-br ${lvl.theme} opacity-5 rounded-[1.5rem]`}></div>
                          )}
                          
                          <span className={`text-2xl mb-2 transition-transform duration-500 ${fatigue === lvl.level ? 'scale-125' : 'scale-100'}`}>
                            {lvl.emoji}
                          </span>
                          <span className={`text-[10px] font-black tracking-tighter ${fatigue === lvl.level ? 'text-slate-800' : 'text-slate-400'}`}>
                            {lvl.label}
                          </span>
                          
                          {fatigue === lvl.level && (
                            <div className={`w-1 h-1 rounded-full mt-1 bg-gradient-to-r ${lvl.theme}`}></div>
                          )}
                        </button>
                      ))}
                   </div>
                </div>

                <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-[1.8rem] font-black shadow-xl shadow-slate-300 active:scale-[0.98] transition-all mt-8 text-sm tracking-widest uppercase text-center">
                  确认并存入档案
                </button>
              </form>
            </section>

            <section className="bg-white/80 backdrop-blur-2xl border border-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/40">
              <div className="flex justify-between items-center mb-6 px-1">
                <h2 className="text-sm font-black flex items-center gap-2 text-slate-800 uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4 text-blue-500" /> 力量趋势图
                </h2>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter italic">左右滑动查看</p>
              </div>
              <LineChart data={records} />
            </section>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[2.2rem] border border-white shadow-sm flex flex-col items-center group active:scale-95 transition-all">
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-2">Max Left</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-blue-600 tracking-tighter">{stats.maxL}</span>
                  <span className="text-[10px] font-bold text-slate-300 uppercase">kg</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-[2.2rem] border border-white shadow-sm flex flex-col items-center group active:scale-95 transition-all">
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-2">Max Right</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-purple-600 tracking-tighter">{stats.maxR}</span>
                  <span className="text-[10px] font-bold text-slate-300 uppercase">kg</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
            <div className="flex justify-between items-center px-4 mb-2">
              <h2 className="text-2xl font-black text-slate-800">历史档案</h2>
              <div className="flex gap-2">
                <button onClick={exportData} className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-full shadow-sm border border-slate-100 text-[10px] font-black text-blue-500 hover:bg-blue-50 transition-all uppercase tracking-widest">
                  <Download className="w-3 h-3" /> 导出
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-full shadow-sm border border-slate-100 text-[10px] font-black text-purple-500 hover:bg-purple-50 transition-all uppercase tracking-widest">
                  <Upload className="w-3 h-3" /> 导入
                </button>
                <input type="file" accept=".json" ref={fileInputRef} onChange={importData} className="hidden" />
              </div>
            </div>
            
            <div className="space-y-3">
              {[...records].reverse().map((record) => {
                const config = getFatigueConfig(record.fatigue);
                const isEditing = editingId === record.id;

                if (isEditing) {
                  return (
                    <div key={record.id} className="bg-white p-5 rounded-[2.2rem] shadow-lg border border-blue-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3"/> {record.date} {record.time || ''}</span>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all"><X className="w-4 h-4" /></button>
                          <button onClick={() => saveEdit(record.id)} className="p-2 text-green-500 hover:bg-green-50 rounded-full transition-all"><Check className="w-4 h-4" /></button>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="flex-1 space-y-1">
                          <label className="text-[9px] font-black text-blue-500 uppercase">左手 (kg)</label>
                          <input type="number" step="0.1" value={editForm.left} onChange={e => setEditForm({...editForm, left: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-center font-black outline-none focus:border-blue-400" placeholder="-" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-[9px] font-black text-purple-500 uppercase">右手 (kg)</label>
                          <input type="number" step="0.1" value={editForm.right} onChange={e => setEditForm({...editForm, right: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-center font-black outline-none focus:border-purple-400" placeholder="-" />
                        </div>
                      </div>

                      <div className="space-y-1 mt-2">
                        <label className="text-[9px] font-black text-amber-500 uppercase">疲劳程度</label>
                        <div className="flex justify-between gap-1">
                          {fatigueLevels.map(lvl => (
                            <button key={lvl.level} onClick={() => setEditForm({...editForm, fatigue: lvl.level})} className={`flex-1 py-2 rounded-xl text-lg transition-all ${editForm.fatigue === lvl.level ? 'bg-amber-100 scale-110 shadow-sm' : 'bg-slate-50 grayscale opacity-50'}`}>
                              {lvl.emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={record.id} className="bg-white/70 backdrop-blur-md p-5 rounded-[2.2rem] shadow-sm border border-white flex items-center justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50/50 flex items-center justify-center text-2xl shadow-inner group-hover:bg-white transition-colors border border-slate-100">
                        {config.emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-slate-800 tracking-tight text-sm">{record.date} <span className="text-[10px] text-slate-400 font-bold">{record.time || ''}</span></p>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase ${config.bg} ${config.textColor}`}>
                            {config.label}
                          </span>
                        </div>
                        <div className="flex gap-4 mt-2">
                          <span className="text-[11px] font-bold text-blue-500 flex items-center gap-1">
                            <Hand className="w-3 h-3 transform -scale-x-100" /> {record.left !== null ? record.left : '-'}
                          </span>
                          <span className="text-[11px] font-bold text-purple-500 flex items-center gap-1">
                            <Hand className="w-3 h-3" /> {record.right !== null ? record.right : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(record)} className="p-3 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteRecord(record.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[85%] max-w-sm bg-white/40 backdrop-blur-xl border border-white/60 p-2 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex justify-between z-50 transition-all duration-500 hover:bg-white/50 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`relative flex-1 flex items-center justify-center py-4 rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden active:scale-95 ${activeTab === 'dashboard' ? 'text-white shadow-lg shadow-slate-400/30' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'}`}
        >
          <div className={`absolute inset-0 bg-gradient-to-tr from-slate-800 to-slate-900 rounded-full -z-10 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeTab === 'dashboard' ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}></div>
          <Activity className={`w-5 h-5 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeTab === 'dashboard' ? 'scale-110' : 'scale-100'}`} />
          <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeTab === 'dashboard' ? 'grid-cols-[1fr] opacity-100 translate-x-0 ml-2' : 'grid-cols-[0fr] opacity-0 -translate-x-4 ml-0'}`}>
            <span className="overflow-hidden whitespace-nowrap text-xs font-black tracking-tight">主页</span>
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`relative flex-1 flex items-center justify-center py-4 rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden active:scale-95 ${activeTab === 'history' ? 'text-white shadow-lg shadow-slate-400/30' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'}`}
        >
          <div className={`absolute inset-0 bg-gradient-to-tr from-slate-800 to-slate-900 rounded-full -z-10 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeTab === 'history' ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}></div>
          <History className={`w-5 h-5 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeTab === 'history' ? 'scale-110' : 'scale-100'}`} />
          <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeTab === 'history' ? 'grid-cols-[1fr] opacity-100 translate-x-0 ml-2' : 'grid-cols-[0fr] opacity-0 -translate-x-4 ml-0'}`}>
            <span className="overflow-hidden whitespace-nowrap text-xs font-black tracking-tight">档案</span>
          </div>
        </button>
      </nav>
    </div>
  );
};

export default App;
