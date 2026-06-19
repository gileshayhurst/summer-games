import type { RecentGame } from '@/lib/types'

export const EXAMPLE_GROUP_NAME = 'Garage League'

export const examplePlayers: string[] = [
  "Adrian",
  "Allie",
  "Ant",
  "Cole",
  "Giles",
  "Jackson",
  "Max",
  "Noah",
  "Pablo",
  "Paige",
  "Phoebe",
  "Rob",
  "Rowan",
  "Sherm",
  "Suren",
  "Tessa"
]

export const examplePongLeaderboard = [
  {
    "name": "Jackson",
    "wins": 32,
    "losses": 14,
    "win_rate": 0.6956521739130435,
    "cup_differential": 37
  },
  {
    "name": "Ant",
    "wins": 30,
    "losses": 25,
    "win_rate": 0.5454545454545454,
    "cup_differential": 28
  },
  {
    "name": "Cole",
    "wins": 24,
    "losses": 23,
    "win_rate": 0.5106382978723404,
    "cup_differential": 4
  },
  {
    "name": "Rowan",
    "wins": 7,
    "losses": 7,
    "win_rate": 0.5,
    "cup_differential": 7
  },
  {
    "name": "Paige",
    "wins": 5,
    "losses": 5,
    "win_rate": 0.5,
    "cup_differential": 0
  },
  {
    "name": "Noah",
    "wins": 11,
    "losses": 13,
    "win_rate": 0.4583333333333333,
    "cup_differential": -2
  },
  {
    "name": "Pablo",
    "wins": 5,
    "losses": 6,
    "win_rate": 0.45454545454545453,
    "cup_differential": -10
  },
  {
    "name": "Giles",
    "wins": 26,
    "losses": 32,
    "win_rate": 0.4482758620689655,
    "cup_differential": -6
  },
  {
    "name": "Phoebe",
    "wins": 4,
    "losses": 5,
    "win_rate": 0.4444444444444444,
    "cup_differential": -7
  },
  {
    "name": "Adrian",
    "wins": 2,
    "losses": 3,
    "win_rate": 0.4,
    "cup_differential": -7
  },
  {
    "name": "Rob",
    "wins": 14,
    "losses": 25,
    "win_rate": 0.358974358974359,
    "cup_differential": -39
  },
  {
    "name": "Tessa",
    "wins": 2,
    "losses": 5,
    "win_rate": 0.2857142857142857,
    "cup_differential": -11
  }
] as const

export const examplePongRecent = [
  {
    "type": "pong",
    "id": "b7be3313-3e6a-40c8-abbc-c4e60325d255",
    "played_at": "2026-06-07T05:49:24.788821+00:00",
    "winners": [
      "Ant",
      "Giles",
      "Adrian"
    ],
    "losers": [
      "Cole",
      "Jackson",
      "Rowan"
    ],
    "cups_left": 1
  },
  {
    "type": "pong",
    "id": "698faf4a-700b-4fb8-8e90-f52ade97eb3e",
    "played_at": "2026-06-07T05:48:50.910867+00:00",
    "winners": [
      "Ant",
      "Cole",
      "Adrian"
    ],
    "losers": [
      "Giles",
      "Jackson",
      "Rowan"
    ],
    "cups_left": 1
  },
  {
    "type": "pong",
    "id": "c5b46019-89c8-40ff-aa22-24886926dec9",
    "played_at": "2026-06-07T05:21:15.958351+00:00",
    "winners": [
      "Jackson",
      "Giles",
      "Rowan"
    ],
    "losers": [
      "Ant",
      "Adrian",
      "Cole"
    ],
    "cups_left": 1
  },
  {
    "type": "pong",
    "id": "cbef1178-746b-419a-adf5-8eeff3c34e73",
    "played_at": "2026-06-07T05:02:48.745655+00:00",
    "winners": [
      "Ant",
      "Cole",
      "Rowan"
    ],
    "losers": [
      "Giles",
      "Jackson",
      "Adrian"
    ],
    "cups_left": 7
  },
  {
    "type": "pong",
    "id": "110df923-9f3d-4bfe-83bf-1c68aa814b4f",
    "played_at": "2026-06-07T04:48:03.25175+00:00",
    "winners": [
      "Ant",
      "Rowan",
      "Cole"
    ],
    "losers": [
      "Adrian",
      "Giles",
      "Jackson"
    ],
    "cups_left": 1
  }
] as const

export const exampleBeerDieLeaderboard = [
  {
    "name": "Noah",
    "wins": 7,
    "losses": 2,
    "win_rate": 0.7777777777777778,
    "point_differential": 11,
    "sinks": 0,
    "self_sinks": 0
  },
  {
    "name": "Ant",
    "wins": 18,
    "losses": 9,
    "win_rate": 0.6666666666666666,
    "point_differential": 59,
    "sinks": 2,
    "self_sinks": 0
  },
  {
    "name": "Rob",
    "wins": 5,
    "losses": 4,
    "win_rate": 0.5555555555555556,
    "point_differential": 7,
    "sinks": 1,
    "self_sinks": 0
  },
  {
    "name": "Cole",
    "wins": 11,
    "losses": 14,
    "win_rate": 0.44,
    "point_differential": -3,
    "sinks": 2,
    "self_sinks": 0
  },
  {
    "name": "Max",
    "wins": 3,
    "losses": 4,
    "win_rate": 0.42857142857142855,
    "point_differential": 13,
    "sinks": 0,
    "self_sinks": 0
  },
  {
    "name": "Giles",
    "wins": 9,
    "losses": 18,
    "win_rate": 0.3333333333333333,
    "point_differential": -47,
    "sinks": 1,
    "self_sinks": 2
  },
  {
    "name": "Rowan",
    "wins": 2,
    "losses": 7,
    "win_rate": 0.2222222222222222,
    "point_differential": -45,
    "sinks": 0,
    "self_sinks": 0
  }
] as const

export const exampleBeerDieRecent = [
  {
    "type": "beer-die",
    "id": "29849d09-a27f-48ef-af82-73763be0804d",
    "played_at": "2026-06-10T03:52:16.168791+00:00",
    "winners": [
      "Ant",
      "Noah",
      "Giles"
    ],
    "losers": [
      "Max",
      "Cole",
      "Rowan"
    ],
    "points_differential": 4
  },
  {
    "type": "beer-die",
    "id": "e230b974-2622-49ca-8df1-3ddc8e6fbb5a",
    "played_at": "2026-06-10T03:51:52.681739+00:00",
    "winners": [
      "Ant",
      "Giles",
      "Noah"
    ],
    "losers": [
      "Cole",
      "Max",
      "Rowan"
    ],
    "points_differential": 9
  },
  {
    "type": "beer-die",
    "id": "ed452bad-c79b-476d-83b7-9641a5121db4",
    "played_at": "2026-06-10T03:51:19.720441+00:00",
    "winners": [
      "Cole",
      "Noah",
      "Max"
    ],
    "losers": [
      "Ant",
      "Rowan",
      "Giles"
    ],
    "points_differential": 9
  },
  {
    "type": "beer-die",
    "id": "9445fc07-cfbf-4c29-9512-3fab2c3fc59b",
    "played_at": "2026-06-10T03:50:23.13301+00:00",
    "winners": [
      "Cole",
      "Ant",
      "Max"
    ],
    "losers": [
      "Giles",
      "Noah",
      "Rowan"
    ],
    "points_differential": 10
  },
  {
    "type": "beer-die",
    "id": "5764156f-7efd-4d47-84ec-94cb04bb5456",
    "played_at": "2026-06-10T03:49:55.467391+00:00",
    "winners": [
      "Ant",
      "Noah",
      "Rowan"
    ],
    "losers": [
      "Cole",
      "Giles",
      "Max"
    ],
    "points_differential": 2
  }
] as const

export const exampleCornholeLeaderboard = [] as const

export const exampleCornholeRecent = [] as const

export const exampleSpikeballLeaderboard = [] as const

export const exampleSpikeballRecent = [] as const

export const exampleHeartsLeaderboard = [
  {
    "name": "Adrian",
    "games_played": 1,
    "losses": 0,
    "loss_rate": 0
  },
  {
    "name": "Giles",
    "games_played": 11,
    "losses": 0,
    "loss_rate": 0
  },
  {
    "name": "Noah",
    "games_played": 3,
    "losses": 0,
    "loss_rate": 0
  },
  {
    "name": "Ant",
    "games_played": 7,
    "losses": 1,
    "loss_rate": 0.14285714285714285
  },
  {
    "name": "Rowan",
    "games_played": 4,
    "losses": 1,
    "loss_rate": 0.25
  },
  {
    "name": "Cole",
    "games_played": 8,
    "losses": 3,
    "loss_rate": 0.375
  },
  {
    "name": "Jackson",
    "games_played": 7,
    "losses": 3,
    "loss_rate": 0.42857142857142855
  },
  {
    "name": "Allie",
    "games_played": 2,
    "losses": 1,
    "loss_rate": 0.5
  },
  {
    "name": "Rob",
    "games_played": 4,
    "losses": 2,
    "loss_rate": 0.5
  }
] as const

export const exampleHeartsRecent = [
  {
    "type": "hearts",
    "id": "c09dd815-23c7-4d71-b3e4-3bad31af2920",
    "played_at": "2026-06-12T01:24:36.076095+00:00",
    "players": [
      "Allie",
      "Ant",
      "Cole",
      "Giles"
    ],
    "loser": "Allie"
  },
  {
    "type": "hearts",
    "id": "15ec18d5-6776-42f9-9a72-699441cf4de6",
    "played_at": "2026-06-12T00:15:06.87493+00:00",
    "players": [
      "Allie",
      "Giles",
      "Cole",
      "Ant"
    ],
    "loser": "Cole"
  },
  {
    "type": "hearts",
    "id": "8dbd4f80-ec4d-454d-8ff9-201966cfaa51",
    "played_at": "2026-06-10T07:28:01.643187+00:00",
    "players": [
      "Giles",
      "Cole",
      "Jackson",
      "Noah"
    ],
    "loser": "Jackson"
  },
  {
    "type": "hearts",
    "id": "9ee5a9e0-a7e3-4814-a417-93f1fc31d26b",
    "played_at": "2026-06-07T04:23:18.047166+00:00",
    "players": [
      "Ant",
      "Cole",
      "Jackson",
      "Rowan",
      "Giles"
    ],
    "loser": "Cole"
  },
  {
    "type": "hearts",
    "id": "e46835a8-ff1d-4ca8-b8a3-3838094da4ee",
    "played_at": "2026-06-07T01:44:53.300404+00:00",
    "players": [
      "Giles",
      "Jackson",
      "Rowan",
      "Ant"
    ],
    "loser": "Rowan"
  }
] as const

export const examplePoolLeaderboard = [] as const

export const examplePoolRecent = [] as const

export const examplePokerLeaderboard = [] as const

export const examplePokerRecent = [] as const

export const exampleRecentAll: RecentGame[] = [
  {
    "type": "hearts",
    "id": "c09dd815-23c7-4d71-b3e4-3bad31af2920",
    "played_at": "2026-06-12T01:24:36.076095+00:00",
    "players": [
      "Allie",
      "Ant",
      "Cole",
      "Giles"
    ],
    "loser": "Allie"
  },
  {
    "type": "hearts",
    "id": "15ec18d5-6776-42f9-9a72-699441cf4de6",
    "played_at": "2026-06-12T00:15:06.87493+00:00",
    "players": [
      "Allie",
      "Giles",
      "Cole",
      "Ant"
    ],
    "loser": "Cole"
  },
  {
    "type": "hearts",
    "id": "8dbd4f80-ec4d-454d-8ff9-201966cfaa51",
    "played_at": "2026-06-10T07:28:01.643187+00:00",
    "players": [
      "Giles",
      "Cole",
      "Jackson",
      "Noah"
    ],
    "loser": "Jackson"
  },
  {
    "type": "beer-die",
    "id": "29849d09-a27f-48ef-af82-73763be0804d",
    "played_at": "2026-06-10T03:52:16.168791+00:00",
    "winners": [
      "Ant",
      "Noah",
      "Giles"
    ],
    "losers": [
      "Max",
      "Cole",
      "Rowan"
    ],
    "points_differential": 4
  },
  {
    "type": "beer-die",
    "id": "e230b974-2622-49ca-8df1-3ddc8e6fbb5a",
    "played_at": "2026-06-10T03:51:52.681739+00:00",
    "winners": [
      "Ant",
      "Giles",
      "Noah"
    ],
    "losers": [
      "Cole",
      "Max",
      "Rowan"
    ],
    "points_differential": 9
  },
  {
    "type": "beer-die",
    "id": "ed452bad-c79b-476d-83b7-9641a5121db4",
    "played_at": "2026-06-10T03:51:19.720441+00:00",
    "winners": [
      "Cole",
      "Noah",
      "Max"
    ],
    "losers": [
      "Ant",
      "Rowan",
      "Giles"
    ],
    "points_differential": 9
  },
  {
    "type": "beer-die",
    "id": "9445fc07-cfbf-4c29-9512-3fab2c3fc59b",
    "played_at": "2026-06-10T03:50:23.13301+00:00",
    "winners": [
      "Cole",
      "Ant",
      "Max"
    ],
    "losers": [
      "Giles",
      "Noah",
      "Rowan"
    ],
    "points_differential": 10
  },
  {
    "type": "beer-die",
    "id": "5764156f-7efd-4d47-84ec-94cb04bb5456",
    "played_at": "2026-06-10T03:49:55.467391+00:00",
    "winners": [
      "Ant",
      "Noah",
      "Rowan"
    ],
    "losers": [
      "Cole",
      "Giles",
      "Max"
    ],
    "points_differential": 2
  },
  {
    "type": "pong",
    "id": "b7be3313-3e6a-40c8-abbc-c4e60325d255",
    "played_at": "2026-06-07T05:49:24.788821+00:00",
    "winners": [
      "Ant",
      "Giles",
      "Adrian"
    ],
    "losers": [
      "Cole",
      "Jackson",
      "Rowan"
    ],
    "cups_left": 1
  },
  {
    "type": "pong",
    "id": "698faf4a-700b-4fb8-8e90-f52ade97eb3e",
    "played_at": "2026-06-07T05:48:50.910867+00:00",
    "winners": [
      "Ant",
      "Cole",
      "Adrian"
    ],
    "losers": [
      "Giles",
      "Jackson",
      "Rowan"
    ],
    "cups_left": 1
  },
  {
    "type": "pong",
    "id": "c5b46019-89c8-40ff-aa22-24886926dec9",
    "played_at": "2026-06-07T05:21:15.958351+00:00",
    "winners": [
      "Jackson",
      "Giles",
      "Rowan"
    ],
    "losers": [
      "Ant",
      "Adrian",
      "Cole"
    ],
    "cups_left": 1
  },
  {
    "type": "pong",
    "id": "cbef1178-746b-419a-adf5-8eeff3c34e73",
    "played_at": "2026-06-07T05:02:48.745655+00:00",
    "winners": [
      "Ant",
      "Cole",
      "Rowan"
    ],
    "losers": [
      "Giles",
      "Jackson",
      "Adrian"
    ],
    "cups_left": 7
  },
  {
    "type": "pong",
    "id": "110df923-9f3d-4bfe-83bf-1c68aa814b4f",
    "played_at": "2026-06-07T04:48:03.25175+00:00",
    "winners": [
      "Ant",
      "Rowan",
      "Cole"
    ],
    "losers": [
      "Adrian",
      "Giles",
      "Jackson"
    ],
    "cups_left": 1
  },
  {
    "type": "hearts",
    "id": "9ee5a9e0-a7e3-4814-a417-93f1fc31d26b",
    "played_at": "2026-06-07T04:23:18.047166+00:00",
    "players": [
      "Ant",
      "Cole",
      "Jackson",
      "Rowan",
      "Giles"
    ],
    "loser": "Cole"
  },
  {
    "type": "hearts",
    "id": "e46835a8-ff1d-4ca8-b8a3-3838094da4ee",
    "played_at": "2026-06-07T01:44:53.300404+00:00",
    "players": [
      "Giles",
      "Jackson",
      "Rowan",
      "Ant"
    ],
    "loser": "Rowan"
  }
] as unknown as RecentGame[]
