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
                            <span className="text-xl font-bold text-slate-800">二人暮らしの家計簿</span>
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
                            家計簿も資産管理も<br />
                            <span className="text-emerald-600">これひとつ</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                            「面倒」を「一瞬」に変える、カップル・夫婦のための家計管理アプリ。<br className="hidden sm:block" />
                            お金の管理がもっとシンプルに、もっと楽しくなります。
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
                                <Shield className="w-5 h-5 text-emerald-600" />
                                <span>銀行レベルのセキュリティ</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Heart className="w-5 h-5 text-emerald-600" />
                                <span>完全無料で利用可能</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-emerald-600" />
                                <span>30秒で登録完了</span>
                            </div>
                        </div>
                    </div>

                    {/* Problem & Solution */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 max-w-5xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                    こんな悩み、ありませんか？
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-1">
                                            <span className="text-red-600 text-sm">✗</span>
                                        </div>
                                        <span className="text-slate-600">家計簿アプリが複雑すぎて続かない</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-1">
                                            <span className="text-red-600 text-sm">✗</span>
                                        </div>
                                        <span className="text-slate-600">パートナーとの支出が曖昧になりがち</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-1">
                                            <span className="text-red-600 text-sm">✗</span>
                                        </div>
                                        <span className="text-slate-600">毎月の精算が面倒で喧嘩になる</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-1">
                                            <span className="text-red-600 text-sm">✗</span>
                                        </div>
                                        <span className="text-slate-600">お金の流れが見えず不安</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-emerald-600 mb-6">
                                    すべて解決します！
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mt-1">
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <span className="text-slate-600">シンプルな操作で誰でも続けられる</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mt-1">
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <span className="text-slate-600">リアルタイムで支出を共有・透明化</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mt-1">
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <span className="text-slate-600">自動精算でストレスフリー</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mt-1">
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <span className="text-slate-600">美しいグラフで支出を可視化</span>
                                    </div>
                                </div>
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
                            家計管理がこんなに変わります
                        </h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            二人暮らしに特化した機能で、お金の悩みをすべて解決
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
                        <div>
                            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                                <Zap className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">
                                面倒な家計簿を一瞬で
                            </h3>
                            <p className="text-lg text-slate-600 mb-6">
                                従来の家計簿アプリは機能が多すぎて挫折しがち。
                                私たちは本当に必要な機能だけに絞り、
                                誰でも続けられるシンプルさを実現しました。
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                    <span className="text-slate-600">3タップで支出記録完了</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                    <span className="text-slate-600">複雑な設定は一切不要</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                    <span className="text-slate-600">直感的で美しいデザイン</span>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 h-80 flex items-center justify-center">
                            <div className="text-center">
                                <Smartphone className="w-24 h-24 text-emerald-600 mx-auto mb-4" />
                                <p className="text-slate-600">アプリのモックアップ画像</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
                        <div className="md:order-2">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                                <Users className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">
                                二人だけの家計簿
                            </h3>
                            <p className="text-lg text-slate-600 mb-6">
                                一般的な家計簿アプリは個人用。
                                でも同棲や結婚生活では、二人で支出を共有することが重要。
                                リアルタイムで同期して、透明性のある家計管理を実現します。
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    <span className="text-slate-600">リアルタイム同期でいつでも最新</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    <span className="text-slate-600">誰がいくら使ったか一目瞭然</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    <span className="text-slate-600">月末の精算も自動計算</span>
                                </li>
                            </ul>
                        </div>
                        <div className="md:order-1 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 h-80 flex items-center justify-center">
                            <div className="text-center">
                                <Heart className="w-24 h-24 text-blue-600 mx-auto mb-4" />
                                <p className="text-slate-600">カップル画像</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                                <PieChart className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">
                                お金の流れが見える化
                            </h3>
                            <p className="text-lg text-slate-600 mb-6">
                                「今月何にいくら使った？」がすぐにわかる。
                                美しいグラフで支出傾向を可視化し、
                                無駄遣いを発見して効率的に節約できます。
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                                    <span className="text-slate-600">カテゴリ別支出の円グラフ</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                                    <span className="text-slate-600">月別推移の折れ線グラフ</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                                    <span className="text-slate-600">予算との比較表示</span>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 h-80 flex items-center justify-center">
                            <div className="text-center">
                                <BarChart3 className="w-24 h-24 text-purple-600 mx-auto mb-4" />
                                <p className="text-slate-600">グラフ画像</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                            こんな方におすすめ
                        </h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            様々な生活スタイルの方にご利用いただいています
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                                <Heart className="w-6 h-6 text-pink-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-3">同棲・新婚カップル</h3>
                            <p className="text-slate-600 text-sm">
                                お金の管理を始めたい、お互いの支出を透明化したいカップルに最適。
                            </p>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <Repeat className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-3">家計簿が続かない方</h3>
                            <p className="text-slate-600 text-sm">
                                複雑な家計簿アプリで挫折した経験のある方。シンプルな操作で続けられます。
                            </p>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                <TrendingUp className="w-6 h-6 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-3">節約志向の方</h3>
                            <p className="text-slate-600 text-sm">
                                支出の見える化で無駄遣いを発見。効率的な節約で貯金額を増やしたい方に。
                            </p>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                                <Smartphone className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-3">デジタル派</h3>
                            <p className="text-slate-600 text-sm">
                                手書きの家計簿は面倒、クラウドで管理したい。いつでもデータにアクセス。
                            </p>
                        </div>
                    </div>
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
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-semibold text-white mb-4">
                                デモでは以下の機能をお試しいただけます
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Calculator className="w-8 h-8 text-white" />
                                </div>
                                <h4 className="text-lg font-semibold text-white mb-2">支出の記録</h4>
                                <p className="text-emerald-100 text-sm">
                                    カテゴリ選択と金額入力だけの簡単操作
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BarChart3 className="w-8 h-8 text-white" />
                                </div>
                                <h4 className="text-lg font-semibold text-white mb-2">グラフ分析</h4>
                                <p className="text-emerald-100 text-sm">
                                    美しいグラフで支出傾向を可視化
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-white" />
                                </div>
                                <h4 className="text-lg font-semibold text-white mb-2">精算機能</h4>
                                <p className="text-emerald-100 text-sm">
                                    自動計算で月末の精算も簡単
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-white">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <span className="inline-block bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                            🎉 今なら完全無料
                        </span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                        今すぐ始めて、<br />
                        お金の不安を解消しませんか？
                    </h2>
                    <p className="text-xl text-slate-600 mb-8">
                        無料でアカウントを作成して、二人の家計管理を始めましょう。<br />
                        メールアドレスだけで30秒で登録完了。
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
                            <span>いつでも退会可能</span>
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
                                <span className="text-xl font-bold text-white">二人暮らしの家計簿</span>
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
                                <li><button onClick={scrollToFeatures} className="hover:text-white transition-colors">リアルタイム同期</button></li>
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
                                © 2025 二人暮らしの家計簿. All rights reserved.
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