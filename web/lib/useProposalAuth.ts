'use client'

import { useState, useEffect } from 'react'

export function useProposalAuth() {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    setIsUnlocked(sessionStorage.getItem('proposal_unlocked') === '1')
    setIsChecking(false)
  }, [])

  const unlock = () => {
    sessionStorage.setItem('proposal_unlocked', '1')
    setIsUnlocked(true)
  }

  return { isUnlocked, isChecking, unlock }
}
