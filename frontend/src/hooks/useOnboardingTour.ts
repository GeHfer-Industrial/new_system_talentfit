import { useCallback, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { driver, type Driver, type DriveStep, type Popover } from 'driver.js'
import 'driver.js/dist/driver.css'
import '../styles/onboarding-tour.css'
import { onboardingSteps } from '../lib/onboardingSteps'
import { useCurrentUser, useCompleteOnboarding } from './useCurrentUser'

function waitForElement(selector: string, timeoutMs = 4000): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      resolve()
      return
    }
    const start = Date.now()
    const interval = setInterval(() => {
      if (document.querySelector(selector) || Date.now() - start > timeoutMs) {
        clearInterval(interval)
        resolve()
      }
    }, 100)
  })
}

export function useOnboardingTour() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser } = useCurrentUser()
  const completeOnboarding = useCompleteOnboarding()
  const driverInstanceRef = useRef<Driver | null>(null)
  const autoStartedRef = useRef(false)

  const finishTour = useCallback(() => {
    if (!currentUser?.onboardingCompletedAt) {
      completeOnboarding.mutate()
    }
  }, [completeOnboarding, currentUser?.onboardingCompletedAt])

  const startTour = useCallback(async () => {
    const role = currentUser?.role
    if (!role) return

    const steps = onboardingSteps.filter((s) => s.roles.includes(role))
    if (!steps.length) return

    steps[steps.length - 1] = {
      ...steps[steps.length - 1],
      description: `${steps[steps.length - 1].description} Você pode reabrir esse tutorial quando quiser pelo botão "Tutorial" no menu lateral.`,
    }

    driverInstanceRef.current?.destroy()

    if (location.pathname !== steps[0].path) {
      navigate(steps[0].path)
    }
    await waitForElement(steps[0].selector)

    const driverSteps: DriveStep[] = steps.map((step, index) => {
      const next = steps[index + 1]
      const prev = steps[index - 1]

      const popover: Popover = {
        title: step.title,
        description: step.description,
        side: step.side,
        prevBtnText: 'Voltar',
        nextBtnText: index === steps.length - 1 ? 'Concluir' : 'Próximo',
      }

      if (next && next.path !== step.path) {
        popover.onNextClick = async (_el, _s, opts) => {
          navigate(next.path)
          await waitForElement(next.selector)
          opts.driver.moveNext()
        }
      }
      if (prev && prev.path !== step.path) {
        popover.onPrevClick = async (_el, _s, opts) => {
          navigate(prev.path)
          await waitForElement(prev.selector)
          opts.driver.movePrevious()
        }
      }

      return { element: step.selector, popover }
    })

    const driverObj = driver({
      showProgress: true,
      progressText: '{{current}} de {{total}}',
      allowClose: true,
      allowKeyboardControl: false,
      overlayOpacity: 0.65,
      skipMissingElement: true,
      steps: driverSteps,
      onDestroyStarted: (_el, _step, opts) => {
        opts.driver.destroy()
        finishTour()
      },
    })

    driverInstanceRef.current = driverObj
    driverObj.drive()
  }, [currentUser?.role, location.pathname, navigate, finishTour])

  useEffect(() => {
    if (autoStartedRef.current) return
    if (!currentUser || currentUser.onboardingCompletedAt) return
    if (currentUser.role === 'ADMIN') return
    autoStartedRef.current = true
    const timer = setTimeout(() => startTour(), 600)
    return () => clearTimeout(timer)
  }, [currentUser, startTour])

  return { startTour }
}
