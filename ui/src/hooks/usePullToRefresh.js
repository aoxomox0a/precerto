import { useCallback, useRef, useState } from 'react'

const IDLE = 'idle'
const PULLING = 'pulling'
const READY = 'ready'
const REFRESHING = 'refreshing'

export const usePullToRefresh = (scrollRef, onRefresh, threshold = 72) => {
  const startYRef = useRef(null)
  const startedAtTopRef = useRef(false)
  const pullingRef = useRef(false)
  const statusRef = useRef(IDLE)
  const activationZonePx = 44
  const [pullDistance, setPullDistance] = useState(0)
  const [status, setStatus] = useState(IDLE)
  const isRefreshing = status === REFRESHING
  const refreshHoldDistance = 56
  const maxPullDistance = threshold + 42

  const setPullStatus = useCallback((nextStatus) => {
    statusRef.current = nextStatus
    setStatus(nextStatus)
  }, [])

  const getScrollTop = useCallback(() => {
    const refs = Array.isArray(scrollRef) ? scrollRef : [scrollRef]
    const refScrollTops = refs.map((ref) => {
      const target = ref?.current
      return target && typeof target.scrollTop === 'number' ? target.scrollTop : 0
    })

    return Math.max(
      ...refScrollTops,
      window.scrollY || 0,
      document.scrollingElement?.scrollTop || 0,
      document.documentElement.scrollTop || 0,
      document.body.scrollTop || 0
    )
  }, [scrollRef])

  const isAtTop = useCallback(() => getScrollTop() <= 1, [getScrollTop])

  const resetPull = useCallback(() => {
    startYRef.current = null
    startedAtTopRef.current = false
    pullingRef.current = false
    setPullDistance(0)
    setPullStatus(IDLE)
  }, [setPullStatus])

  const handleTouchStart = useCallback(
    (event) => {
      const currentTarget = event.currentTarget
      const targetScrollTop = typeof currentTarget?.scrollTop === 'number' ? currentTarget.scrollTop : getScrollTop()
      const containerTop = currentTarget?.getBoundingClientRect?.().top ?? 0
      const touchY = event.touches[0].clientY
      const startedNearTopEdge = touchY - containerTop <= activationZonePx

      const canStartPull =
        statusRef.current !== REFRESHING &&
        isAtTop() &&
        targetScrollTop <= 1 &&
        startedNearTopEdge

      startedAtTopRef.current = canStartPull

      if (!canStartPull) {
        startYRef.current = null
        pullingRef.current = false
        setPullDistance(0)
        return
      }

      startYRef.current = event.touches[0].clientY
      pullingRef.current = true
      setPullStatus(PULLING)
    },
    [activationZonePx, getScrollTop, isAtTop, setPullStatus]
  )

  const handleTouchMove = useCallback(
    (event) => {
      if (!startedAtTopRef.current || !pullingRef.current || startYRef.current === null) return
      if (statusRef.current === REFRESHING) return

      if (!isAtTop()) {
        resetPull()
        return
      }

      const nextDistance = event.touches[0].clientY - startYRef.current
      if (nextDistance <= 0) {
        setPullDistance(0)
        setPullStatus(PULLING)
        return
      }

      if (event.cancelable) {
        event.preventDefault()
      }

      const resistedDistance = Math.min(nextDistance * 0.5, maxPullDistance)
      setPullDistance(resistedDistance)
      setPullStatus(resistedDistance >= threshold ? READY : PULLING)
    },
    [isAtTop, maxPullDistance, resetPull, setPullStatus, threshold]
  )

  const handleTouchEnd = useCallback(async () => {
    if (!pullingRef.current || statusRef.current === REFRESHING) return

    const shouldRefresh = pullDistance >= threshold

    startYRef.current = null
    startedAtTopRef.current = false
    pullingRef.current = false

    if (!shouldRefresh || !onRefresh) {
      setPullDistance(0)
      setPullStatus(IDLE)
      return
    }

    setPullStatus(REFRESHING)
    setPullDistance(refreshHoldDistance)
    try {
      await onRefresh()
    } finally {
      setPullDistance(0)
      setPullStatus(IDLE)
    }
  }, [onRefresh, pullDistance, refreshHoldDistance, setPullStatus, threshold])

  return {
    isRefreshing,
    pullDistance,
    status,
    pullHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: resetPull,
    },
  }
}
