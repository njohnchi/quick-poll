export type PollOption = {
  id: string
  text: string
  votes: number
}

export type Poll = {
  id: string
  title: string
  options: PollOption[]
  authorId?: string
  createdAt: string
}

function seedPolls(): Poll[] {
  return [
    {
      id: 'p_abc123',
      title: 'Your favorite frontend framework?',
      options: [
        { id: 'o_vue', text: 'Vue', votes: 5 },
        { id: 'o_react', text: 'React', votes: 7 },
        { id: 'o_svelte', text: 'Svelte', votes: 3 },
      ],
      createdAt: new Date().toISOString(),
    },
  ]
}

export function usePolls() {
  const polls = useState<Poll[]>('polls:list', () => seedPolls())

  function listPolls() {
    return polls.value
  }

  function getPoll(id: string) {
    return polls.value.find((p) => p.id === id) || null
  }

  function createPoll(title: string, options: string[], authorId?: string) {
    const poll: Poll = {
      id: 'p_' + Math.random().toString(36).slice(2, 9),
      title,
      options: options.filter(Boolean).map((text) => ({
        id: 'o_' + Math.random().toString(36).slice(2, 9),
        text,
        votes: 0,
      })),
      authorId,
      createdAt: new Date().toISOString(),
    }
    polls.value.unshift(poll)
    return poll
  }

  function vote(pollId: string, optionId: string) {
    const poll = polls.value.find((p) => p.id === pollId)
    if (!poll) return false
    const opt = poll.options.find((o) => o.id === optionId)
    if (!opt) return false
    opt.votes += 1
    return true
  }

  return { polls, listPolls, getPoll, createPoll, vote }
}

