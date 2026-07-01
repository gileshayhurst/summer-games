export default function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card rounded-xl p-3 text-center border border-warm">
      <p className="text-lg font-black text-stone-900">{value}</p>
      <p className="text-xs text-muted uppercase tracking-widest mt-1">{label}</p>
    </div>
  )
}
