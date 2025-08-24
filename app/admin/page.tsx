"use client"

import Link from "next/link"

export default function AdminPage() {
  return (
    <main className="p-8 flex flex-col items-center gap-6 text-center">
      <div className="text-2xl font-bold">لوحة الإدارة معطّلة</div>
      <p className="opacity-80 max-w-prose">
        تم إزالة تسجيل الدخول والتسجيل. لإدارة المحتوى (الرفع/الحذف) استخدم لوحة Supabase مباشرة
        أو فعّل آلية مخصصة للإدارة لاحقًا.
      </p>
      <Link href="/" className="underline opacity-90 hover:opacity-100">العودة للرئيسية</Link>
    </main>
  )
}
