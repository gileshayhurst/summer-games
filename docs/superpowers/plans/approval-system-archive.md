# Approval System Archive

Re-enable by: (1) running the reverse SQL migration, (2) restoring the code below, (3) re-adding the log page banner.

## Reverse SQL migration

```sql
ALTER TABLE pong_games ALTER COLUMN approved SET DEFAULT false;
ALTER TABLE beer_die_games ALTER COLUMN approved SET DEFAULT false;
ALTER TABLE cornhole_games ALTER COLUMN approved SET DEFAULT false;
ALTER TABLE spikeball_games ALTER COLUMN approved SET DEFAULT false;
ALTER TABLE hearts_games ALTER COLUMN approved SET DEFAULT false;
```

## Log page banner (add above `<LogTabs>` in `app/g/[slug]/log/page.tsx`)

```tsx
<div className="bg-amber-50 border border-warm rounded-xl px-4 py-3 mb-8 text-sm text-stone-700">
  🔒 <span className="font-bold">Games are reviewed before appearing on the leaderboard</span> — this keeps things fair on a public site.
  To approve submissions, tap the ⚙️ icon in the nav (PIN required).
</div>
```

## AdminPanel pending props (restore to Props type in `components/admin/AdminPanel.tsx`)

```ts
pendingPongGames: AdminPongGame[]
pendingBeerDieGames: AdminBeerDieGame[]
pendingCornholeGames: AdminCornholeGame[]
pendingSpikeballGames: AdminSpikeballGame[]
pendingHeartsGames: AdminHeartsGame[]
```

## AdminPanel pending state + handler (restore inside component body)

```ts
const [approveLoading, setApproveLoading] = useState<string | null>(null)

const handleApprove = async (kind: string, id: string) => {
  setApproveLoading(id)
  await fetch(apiPath(kind, id), { method: 'PATCH' })
  setApproveLoading(null)
  window.location.reload()
}

const pendingGames: AllGame[] = [
  ...pendingPongGames.map(g => ({ kind: 'pong' as const, played_at: g.played_at, data: g })),
  ...pendingBeerDieGames.map(g => ({ kind: 'beer-die' as const, played_at: g.played_at, data: g })),
  ...pendingCornholeGames.map(g => ({ kind: 'cornhole' as const, played_at: g.played_at, data: g })),
  ...pendingSpikeballGames.map(g => ({ kind: 'spikeball' as const, played_at: g.played_at, data: g })),
  ...pendingHeartsGames.map(g => ({ kind: 'hearts' as const, played_at: g.played_at, data: g })),
].sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())
```

## GameRow approve button (restore inside `!isConfirmingDelete` block, before Edit button, when `isPending`)

```tsx
{isPending ? (
  <button
    onClick={() => handleApprove(g.kind, id)}
    disabled={approveLoading === id}
    className="text-xs font-bold bg-win text-white px-2 py-1 rounded-full hover:bg-orange-400 disabled:opacity-50 transition-colors"
  >
    {approveLoading === id ? '...' : '✓ Approve'}
  </button>
) : (
  <button onClick={() => setEditingId(isEditing ? null : id)} ...>
    {isEditing ? 'Close' : '✏️ Edit'}
  </button>
)}
```

## Pending Approval section (restore before the main games list in AdminPanel return)

```tsx
{pendingGames.length > 0 && (
  <div>
    <h2 className="text-sm font-black uppercase tracking-widest text-muted mb-3">
      Pending Approval
      <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">{pendingGames.length}</span>
    </h2>
    <div className="space-y-2">
      {pendingGames.map(g => <GameRow key={g.data.id} g={g} isPending={true} />)}
    </div>
  </div>
)}
{pendingGames.length > 0 && (
  <h2 className="text-sm font-black uppercase tracking-widest text-muted mb-3">Approved Games</h2>
)}
```

## Admin page pending queries (restore to the Promise.all in `app/g/[slug]/admin/page.tsx`)

```ts
supabase.from('pong_games').select('id, cups_left, played_at').eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }),
supabase.from('pong_games').select('id, cups_left, played_at').eq('group_id', group.id).eq('approved', false).order('played_at', { ascending: false }),
// repeat pattern for beer_die_games, cornhole_games, spikeball_games, hearts_games
```
