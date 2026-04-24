import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Lock,
  Menu,
  PieChart,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  X
} from 'lucide-react';
import heroImage from '../assets/landing-hero.jpg';

const navItems = [
  { label: 'できること', target: 'features' },
  { label: '流れ', target: 'workflow' },
  { label: 'デモ', target: 'demo' }
];

const featureItems = [
  {
    icon: ReceiptText,
    title: '入力は最小限',
    body: '金額、カテゴリ、支払者だけをすばやく記録。毎日の入力を重くしません。'
  },
  {
    icon: Users,
    title: '二人の負担が見える',
    body: '誰がいくら払ったかを並べて表示。月末の話し合いが短くなります。'
  },
  {
    icon: PieChart,
    title: '内訳がすぐ分かる',
    body: 'カテゴリ別の支出をランキングで確認。増えた支出にすぐ気づけます。'
  },
  {
    icon: Lock,
    title: '月締めで区切れる',
    body: '締めた月は履歴として残し、あとから修正が必要なときも理由を残せます。'
  }
];

const workflowItems = [
  ['1', '支出を追加', '買い物や家賃を、支払った人と一緒に記録します。'],
  ['2', '今月を確認', '合計、負担バランス、予算進捗をひとつの画面で確認します。'],
  ['3', '月末に精算', '誰が誰にいくら払うかを確認して、その月を締めます。']
];

function scrollToSection(target) {
  document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNav = (target) => {
    scrollToSection(target);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="Futakake トップへ">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-50 text-sky-700">
              <Wallet size={23} />
            </div>
            <div>
              <div className="text-base font-bold leading-tight text-slate-950">Futakake</div>
              <div className="text-xs text-slate-500">二人暮らしの家計簿</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="メインナビゲーション">
            {navItems.map((item) => (
              <button
                key={item.target}
                type="button"
                onClick={() => handleNav(item.target)}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              to="/login"
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              ログイン
            </Link>
            <Link
              to="/app?demo=true"
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              デモを開く
              <ArrowRight size={16} />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="rounded-md border border-slate-200 p-2 text-slate-700 md:hidden"
            aria-label="メニューを開閉"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.target}
                  type="button"
                  onClick={() => handleNav(item.target)}
                  className="rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {item.label}
                </button>
              ))}
              <Link to="/login" className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                ログイン
              </Link>
              <Link to="/app?demo=true" className="rounded-md bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white">
                デモを開く
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden bg-white">
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[62%_center]"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-white/64 sm:bg-white/54" aria-hidden="true" />
          <div
            className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-white via-white/94 to-white/18 lg:w-[72%]"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-white/0" aria-hidden="true" />
          <div className="relative mx-auto flex min-h-[620px] max-w-7xl flex-col justify-center px-4 py-14 sm:px-6 lg:min-h-[640px] lg:px-8">
            <div className="max-w-3xl pt-10">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1.5 text-sm font-medium text-sky-800 shadow-sm">
                <Sparkles size={15} />
                二人暮らしの支出、精算までひとつに
              </div>

              <h1 className="text-4xl font-bold leading-tight tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
                二人の家計を、
                <br />
                月末に迷わない形へ。
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Futakake は、カップル・夫婦の共同支出を記録し、誰が誰にいくら精算すればよいかを自動で整理する家計簿です。
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/app?demo=true"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  デモで試す
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-800 hover:bg-slate-50"
                >
                  アカウントを作成
                </Link>
              </div>

              <div className="mt-8 grid max-w-2xl grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  登録なしでデモ可
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  精算額を自動計算
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  月締め履歴を保存
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 border-y border-slate-200 bg-white py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 text-sm font-semibold text-sky-700">できること</div>
                <h2 className="text-3xl font-bold text-slate-950">家計簿を続けるための、必要な機能だけ。</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-600">
                記録、確認、精算の流れを短くして、二人で同じ数字を見られる状態を作ります。
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              {featureItems.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-white text-sky-700 shadow-sm">
                      <Icon size={21} />
                    </div>
                    <h3 className="text-base font-semibold text-slate-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="workflow" className="scroll-mt-20 bg-slate-50 py-14">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <div className="mb-2 text-sm font-semibold text-sky-700">流れ</div>
              <h2 className="text-3xl font-bold text-slate-950">入力から精算まで、月ごとに完結。</h2>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                家計簿アプリにありがちな細かい分析よりも、共同生活で必要になる「誰が払ったか」「今月はいくらか」「どう精算するか」を優先しています。
              </p>
            </div>

            <div className="space-y-3">
              {workflowItems.map(([number, title, body]) => (
                <div key={number} className="grid grid-cols-[44px_minmax(0,1fr)] gap-4 rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-900 text-sm font-bold text-white">
                    {number}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-950">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="demo" className="scroll-mt-20 bg-white py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-sm lg:grid-cols-[1fr_auto] lg:items-center lg:p-7">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">
                  <ShieldCheck size={15} />
                  デモデータはこのブラウザ内だけに保存
                </div>
                <h2 className="text-2xl font-bold sm:text-3xl">まずは実際の画面で試せます。</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  登録前に、支出追加、検索、精算、月締めまで一通り触れます。デモで作成したデータは本番アカウントには送信されません。
                </p>
              </div>
              <Link
                to="/app?demo=true"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-base font-semibold text-slate-950 hover:bg-slate-100"
              >
                デモを開始
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-14">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <BarChart3 className="mb-4 text-sky-700" size={26} />
              <h3 className="font-semibold text-slate-950">今月の状態がすぐ分かる</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">合計支出、予算、前月比、精算見込みを同じ画面にまとめています。</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <Users className="mb-4 text-sky-700" size={26} />
              <h3 className="font-semibold text-slate-950">二人の名前で管理できる</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">表示名を変更できるので、共同支出を自分たちの言葉で管理できます。</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <Lock className="mb-4 text-sky-700" size={26} />
              <h3 className="font-semibold text-slate-950">締めた月を残せる</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">締め済み、精算完了、解除履歴を残して、あとから見返せます。</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-50 text-sky-700">
              <Wallet size={20} />
            </div>
            <div>
              <div className="font-semibold text-slate-800">Futakake</div>
              <div>二人暮らしの家計簿</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <button type="button" onClick={() => scrollToSection('features')} className="hover:text-slate-900">
              できること
            </button>
            <button type="button" onClick={() => scrollToSection('workflow')} className="hover:text-slate-900">
              流れ
            </button>
            <Link to="/app?demo=true" className="hover:text-slate-900">
              デモ
            </Link>
            <span>© 2026 Futakake</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
