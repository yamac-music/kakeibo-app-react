import React from 'react';
import { Link } from 'react-router-dom';
import { Calculator, TrendingUp, Users, Shield, Smartphone, BarChart3, Heart, Star, CheckCircle, ArrowRight } from 'lucide-react';

const LandingPage = () => {
    const scrollToFeatures = () => {
        document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToDemo = () => {
        document.getElementById('demo').scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-sky-600 to-blue-700 rounded-xl flex items-center justify-center">
                                <Calculator className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-slate-800">二人暮らしの家計簿</span>
                        </div>
                        <nav className="hidden md:flex items-center space-x-8">
                            <button onClick={scrollToFeatures} className="text-slate-600 hover:text-sky-600 transition-colors">
                                機能
                            </button>
                            <button onClick={scrollToDemo} className="text-slate-600 hover:text-sky-600 transition-colors">
                                デモ
                            </button>
                            <Link to="/login" className="bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700 transition-colors">
                                ログイン
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
                            <span className="text-sky-600">二人で</span>始める
                            <br />
                            かんたん家計管理
                        </h1>
                        <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
                            カップルや夫婦で共有できる家計簿アプリ。支出の記録から分析まで、
                            <br className="hidden sm:block" />
                            お金の管理をもっとシンプルに、もっと楽しく。
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/signup" className="bg-sky-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-sky-700 transition-colors shadow-lg hover:shadow-xl">
                                無料で始める
                                <ArrowRight className="w-5 h-5 ml-2 inline" />
                            </Link>
                            <button 
                                onClick={scrollToDemo}
                                className="border-2 border-sky-600 text-sky-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-sky-50 transition-colors"
                            >
                                デモを試す
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                            <div className="text-3xl font-bold text-sky-600 mb-2">100%</div>
                            <div className="text-slate-600">無料</div>
                        </div>
                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                            <div className="text-3xl font-bold text-sky-600 mb-2">2人</div>
                            <div className="text-slate-600">専用設計</div>
                        </div>
                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                            <div className="text-3xl font-bold text-sky-600 mb-2">リアルタイム</div>
                            <div className="text-slate-600">同期</div>
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
                            二人暮らしに特化した機能で、お金の管理がもっと簡単に
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-sky-600 rounded-lg flex items-center justify-center mb-6">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-4">二人専用設計</h3>
                            <p className="text-slate-600">
                                カップルや夫婦での共有を前提とした設計。お互いの支出を透明化し、
                                健全な家計管理をサポートします。
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mb-6">
                                <BarChart3 className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-4">視覚的な分析</h3>
                            <p className="text-slate-600">
                                美しいグラフとチャートで支出を可視化。
                                月別・カテゴリ別の分析で、お金の流れが一目でわかります。
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-6">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-4">セキュリティ重視</h3>
                            <p className="text-slate-600">
                                Firebase認証による安全なログイン。
                                データは暗号化され、プライバシーを完全に保護します。
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-6">
                                <Smartphone className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-4">どこでも使える</h3>
                            <p className="text-slate-600">
                                スマートフォン、タブレット、PCに完全対応。
                                外出先でもすぐに支出を記録できます。
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center mb-6">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-4">精算機能</h3>
                            <p className="text-slate-600">
                                誰がいくら支払ったかを自動計算。
                                月末の精算がワンクリックで完了します。
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center mb-6">
                                <Heart className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-4">使いやすさ</h3>
                            <p className="text-slate-600">
                                直感的な操作で、家計簿が苦手な方でも続けられる。
                                シンプルで美しいデザインです。
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 bg-gradient-to-r from-sky-600 to-blue-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center text-white mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                            こんな方におすすめ
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8">
                            <div className="flex items-center mb-6">
                                <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
                                <h3 className="text-xl font-semibold text-white">同棲・新婚カップル</h3>
                            </div>
                            <p className="text-sky-100">
                                お金の管理を始めたい、お互いの支出を透明化したいカップルに最適。
                                将来の計画も立てやすくなります。
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8">
                            <div className="flex items-center mb-6">
                                <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
                                <h3 className="text-xl font-semibold text-white">家計簿が続かない方</h3>
                            </div>
                            <p className="text-sky-100">
                                複雑な家計簿アプリで挫折した経験のある方。
                                シンプルな操作で、無理なく続けられます。
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8">
                            <div className="flex items-center mb-6">
                                <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
                                <h3 className="text-xl font-semibold text-white">節約志向の方</h3>
                            </div>
                            <p className="text-sky-100">
                                支出の見える化で無駄遣いを発見。
                                効率的な節約で貯金額を増やしたい方に。
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8">
                            <div className="flex items-center mb-6">
                                <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
                                <h3 className="text-xl font-semibold text-white">デジタル派</h3>
                            </div>
                            <p className="text-sky-100">
                                手書きの家計簿は面倒、クラウドで管理したい。
                                いつでもどこでもデータにアクセスできます。
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Demo Section */}
            <section id="demo" className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                            まずはお試しください
                        </h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
                            登録不要でデモ版をお試しいただけます。
                            実際の操作感を体験してみてください。
                        </p>
                        <Link 
                            to="/app?demo=true" 
                            className="inline-flex items-center bg-gradient-to-r from-sky-600 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-sky-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                        >
                            <Smartphone className="w-5 h-5 mr-2" />
                            デモを開始する
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-bold text-sky-600">1</span>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">支出を記録</h3>
                                <p className="text-slate-600">
                                    日々の支出をカテゴリ別に記録。
                                    誰が支払ったかも記録できます。
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-bold text-emerald-600">2</span>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">データを分析</h3>
                                <p className="text-slate-600">
                                    グラフで支出傾向を可視化。
                                    予算との比較も簡単です。
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-bold text-purple-600">3</span>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">精算・共有</h3>
                                <p className="text-slate-600">
                                    月末に自動で精算額を計算。
                                    パートナーと簡単に共有できます。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                        今すぐ始めて、お金の不安を解消しませんか？
                    </h2>
                    <p className="text-xl text-sky-100 mb-8">
                        無料でアカウントを作成して、二人の家計管理を始めましょう。
                        登録は30秒で完了します。
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link 
                            to="/signup" 
                            className="bg-white text-sky-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-sky-50 transition-colors shadow-lg hover:shadow-xl"
                        >
                            無料でアカウント作成
                            <ArrowRight className="w-5 h-5 ml-2 inline" />
                        </Link>
                        <Link 
                            to="/login" 
                            className="border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transition-colors"
                        >
                            すでにアカウントをお持ちの方
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-sky-600 to-blue-700 rounded-xl flex items-center justify-center">
                                <Calculator className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white">二人暮らしの家計簿</span>
                        </div>
                        <p className="text-slate-400 mb-6">
                            二人で始める、かんたん家計管理
                        </p>
                        <div className="flex items-center justify-center space-x-6 text-sm text-slate-400">
                            <span>© 2025 二人暮らしの家計簿</span>
                            <span>Made with React & Firebase</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;