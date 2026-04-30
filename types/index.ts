export interface Lead {
      id?: string
        name: string
          email: string
            company?: string
              service: string
                budget?: string
                  message: string
                    created_at?: string
                    }

                    export interface Service {
                      id: string
                        title: string
                          description: string
                            tier: 'authority' | 'conversion' | 'operations' | 'retention'
                              price_from: number
                              }

                              export type NavItem = {
                                label: string
                                  href: string
                                  }
}