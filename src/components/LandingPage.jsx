import React from 'react';
import { Link } from 'react-router-dom';
import { Calculator, TrendingUp, Users, Shield, Smartphone, BarChart3, Heart, Star, CheckCircle, ArrowRight, Zap, Clock, PieChart, Camera, Repeat, Download, Menu, X } from 'lucide-react';

const LandingPage = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const scrollToFeatures = () => {
        document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
        setIsMenuOpen(false);
    };

    const scrollToDemo = () => {
        document.getElementById('demo').scrollIntoView({ behavior: 'smooth' });
        setIsMenuOpen(false);
    };

    const scrollToHowItWorks = () => {
        document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' });
        setIsMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                                <Calculator className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-slate-800">Futakake</span>
                        </div>
                        
                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-8">
                            <button onClick={scrollToFeatures} className="text-slate-600 hover:text-emerald-600 transition-colors font-medium">
                                機能
                            </button>
                            <button onClick={scrollToHowItWorks} className="text-slate-600 hover:text-emerald-600 transition-colors font-medium">
                                使い方
                            </button>
                            <button onClick={scrollToDemo} className="text-slate-600 hover:text-emerald-600 transition-colors font-medium">
                                デモ
                            </button>
                            <Link to="/login" className="text-slate-600 hover:text-emerald-600 transition-colors font-medium">
                                ログイン
                            </Link>
                            <Link to="/signup" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                                無料で始める
                            </Link>
                        </nav>

                        {/* Mobile Menu Button */}
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>

                    {/* Mobile Navigation */}
                    {isMenuOpen && (
                        <div className="md:hidden py-4 border-t border-slate-200">
                            <div className="flex flex-col space-y-4">
                                <button onClick={scrollToFeatures} className="text-slate-600 hover:text-emerald-600 transition-colors font-medium text-left">
                                    機能
                                </button>
                                <button onClick={scrollToHowItWorks} className="text-slate-600 hover:text-emerald-600 transition-colors font-medium text-left">
                                    使い方
                                </button>
                                <button onClick={scrollToDemo} className="text-slate-600 hover:text-emerald-600 transition-colors font-medium text-left">
                                    デモ
                                </button>
                                <Link to="/login" className="text-slate-600 hover:text-emerald-600 transition-colors font-medium">
                                    ログイン
                                </Link>
                                <Link to="/signup" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium inline-block">
                                    無料で始める
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-12 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="mb-6">
                            <span className="inline-block bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                                ✨ 二人暮らし専用の家計簿アプリ
                            </span>
                        </div>
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
                            二人の家計管理が<br />
                            <span className="text-emerald-600">かんたんに</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                            カップル・夫婦で使える家計簿アプリ。<br className="hidden sm:block" />
                            シンプルな操作で続けられます。
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                            <Link to="/signup" className="bg-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                                無料で始める
                                <ArrowRight className="w-5 h-5 ml-2 inline" />
                            </Link>
                            <button 
                                onClick={scrollToDemo}
                                className="border-2 border-emerald-600 text-emerald-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-emerald-50 transition-colors"
                            >
                                デモを試す
                            </button>
                        </div>
                        
                        {/* Trust Indicators */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <Heart className="w-5 h-5 text-emerald-600" />
                                <span>完全無料</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-emerald-600" />
                                <span>30秒で登録</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-emerald-600" />
                                <span>安心・安全</span>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                            たった3ステップで始められます
                        </h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            面倒な設定は一切不要。今すぐ家計管理を始めましょう
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl font-bold text-emerald-600">1</span>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-4">アカウント作成</h3>
                            <p className="text-slate-600">
                                メールアドレスだけで30秒で登録完了。
                                パートナーを招待してすぐに共有開始。
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl font-bold text-blue-600">2</span>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-4">支出を記録</h3>
                            <p className="text-slate-600">
                                買い物後にサッと入力するだけ。
                                カテゴリと支払い者を選んで完了。
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl font-bold text-purple-600">3</span>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-4">自動で分析・精算</h3>
                            <p className="text-slate-600">
                                グラフで支出傾向を確認。
                                月末の精算額も自動計算されます。
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                            なぜ選ばれるのか
                        </h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            二人暮らしに特化した、シンプルで続けやすい家計簿
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Zap className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4">
                                かんたん操作
                            </h3>
                            <p className="text-slate-600">
                                3タップで支出記録完了。
                                複雑な設定は一切不要です。
                            </p>
                        </div>

                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Users className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4">
                                二人で共有
                            </h3>
                            <p className="text-slate-600">
                                データ共有で
                                お互いの支出を管理。
                            </p>
                        </div>

                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <BarChart3 className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4">
                                自動で分析
                            </h3>
                            <p className="text-slate-600">
                                グラフで支出を可視化。
                                月末の精算も自動計算。
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                </div>
            </section>

            {/* Demo Section */}
            <section id="demo" className="py-20 bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                            まずはデモをお試しください
                        </h2>
                        <p className="text-xl text-emerald-100 max-w-2xl mx-auto mb-8">
                            登録不要でデモ版をお試しいただけます。<br />
                            実際の操作感を今すぐ体験してみてください。
                        </p>
                        <Link 
                            to="/app?demo=true" 
                            className="inline-flex items-center bg-white text-emerald-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-emerald-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                            <Smartphone className="w-5 h-5 mr-2" />
                            デモを開始する
                        </Link>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-4xl mx-auto">
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-white">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                        今すぐ始めませんか？
                    </h2>
                    <p className="text-xl text-slate-600 mb-8">
                        無料でアカウントを作成して、二人の家計管理を始めましょう。
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                        <Link 
                            to="/signup" 
                            className="bg-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                            無料でアカウント作成
                            <ArrowRight className="w-5 h-5 ml-2 inline" />
                        </Link>
                        <Link 
                            to="/login" 
                            className="border-2 border-emerald-600 text-emerald-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-emerald-50 transition-colors"
                        >
                            すでにアカウントをお持ちの方
                        </Link>
                    </div>
                    
                    {/* Trust Indicators */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <span>SSL暗号化通信</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4" />
                            <span>完全無料</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>いつでも登録可能</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div className="md:col-span-2">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                                    <Calculator className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xl font-bold text-white">Futakake</span>
                            </div>
                            <p className="text-slate-400 mb-6 max-w-md">
                                カップル・夫婦のための家計管理アプリ。<br />
                                シンプルで続けやすい、二人専用の家計簿です。
                            </p>
                            <div className="flex space-x-4">
                                <Link 
                                    to="/signup" 
                                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                                >
                                    無料で始める
                                </Link>
                                <Link 
                                    to="/app?demo=true" 
                                    className="border border-slate-600 text-slate-300 px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
                                >
                                    デモを試す
                                </Link>
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="text-white font-semibold mb-4">機能</h4>
                            <ul className="space-y-2 text-slate-400 text-sm">
                                <li><button onClick={scrollToFeatures} className="hover:text-white transition-colors">家計簿機能</button></li>
                                <li><button onClick={scrollToFeatures} className="hover:text-white transition-colors">グラフ分析</button></li>
                                <li><button onClick={scrollToFeatures} className="hover:text-white transition-colors">精算機能</button></li>
                                <li><button onClick={scrollToFeatures} className="hover:text-white transition-colors">データ共有</button></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="text-white font-semibold mb-4">サポート</h4>
                            <ul className="space-y-2 text-slate-400 text-sm">
                                <li><button onClick={scrollToHowItWorks} className="hover:text-white transition-colors">使い方</button></li>
                                <li><button onClick={scrollToDemo} className="hover:text-white transition-colors">デモ</button></li>
                                <li><Link to="/login" className="hover:text-white transition-colors">ログイン</Link></li>
                                <li><Link to="/signup" className="hover:text-white transition-colors">新規登録</Link></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="border-t border-slate-800 pt-8">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <div className="text-sm text-slate-400 mb-4 md:mb-0">
                                © 2025 Futakake. All rights reserved.
                            </div>
                            <div className="flex items-center space-x-6 text-sm text-slate-400">
                                <span className="flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    セキュア
                                </span>
                                <span className="flex items-center gap-2">
                                    <Heart className="w-4 h-4" />
                                    Made with React & Firebase
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;