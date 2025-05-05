import { api } from '@/shared/api/instance'
import type { ApiResponse } from '@/shared/api/types'
import type { Tokens } from '../model/types'
import { createLogger } from '@/shared/lib/logger'

const logger = createLogger({ module: 'AuthAPI' })

interface TokenExchangeRequest {
  code: string
  redirect_uri: string
}

interface TokenResponse {
  meta: {
    fetchedAt: string
  }
  item: {
    access_token: string
    refresh_token: string
    id_token: string
    expires_in: number
  }
}

export const authApi = {
  exchangeCode: async (params: TokenExchangeRequest): Promise<ApiResponse<Tokens>> => {
    try {
      logger.debug('Exchanging auth code for tokens', { redirectUri: params.redirect_uri })
      const response = await api.post<TokenResponse>('/auth/token', params)
      logger.debug('Token exchange successful')
      return {
        data: {
          accessToken: response.data.item.access_token,
          refreshToken: response.data.item.refresh_token,
          idToken: response.data.item.id_token,
          expiresIn: response.data.item.expires_in,
        },
        meta: response.data.meta,
      }
    } catch (error) {
      logger.error('Token exchange failed:', error)
      throw error
    }
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<Tokens>> => {
    try {
      logger.debug('Refreshing tokens')
      const response = await api.post<ApiResponse<Tokens>>('/auth/refresh', {
        refreshToken,
      })
      logger.debug('Token refresh successful')
      return response.data
    } catch (error) {
      logger.error('Token refresh failed:', error)
      throw error
    }
  },

  logout: async (): Promise<void> => {
    try {
      logger.debug('Logging out user')
      await api.post('/auth/logout')
      logger.debug('Logout successful')
    } catch (error) {
      logger.error('Logout failed:', error)
      throw error
    }
  },
} 