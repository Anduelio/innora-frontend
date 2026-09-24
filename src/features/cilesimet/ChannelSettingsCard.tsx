import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { errorText } from '@/lib/api/client'
import { useChannelCatalog, useChannelConnections, useDeleteChannel, useSaveChannel } from '@/lib/api/channels'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button/Button'
import { Field } from '@/components/ui/Field/Field'
import { Checkbox } from '@/components/ui/Checkbox/Checkbox'
import { Dropdown } from '@/components/ui/Dropdown/Dropdown'
import { TextInput } from '@/components/ui/TextInput/TextInput'
import s from './ChannelSettingsCard.module.scss'

export function ChannelSettingsCard() {
  const { t } = useTranslation()
  const catalog = useChannelCatalog()
  const connections = useChannelConnections()
  const save = useSaveChannel()
  const remove = useDeleteChannel()
  const showToast = useUiStore((state) => state.showToast)
  const providers = useMemo(() => catalog.data?.providers ?? [], [catalog.data])
  const [providerCode, setProviderCode] = useState('beds24')
  const [isActive, setIsActive] = useState(true)
  const [values, setValues] = useState<Record<string, string>>({})

  const provider = useMemo(
    () => providers.find((item) => item.code === providerCode) ?? providers[0],
    [providers, providerCode],
  )

  const saved = connections.data?.find((item) => item.providerCode === provider?.code)

  useEffect(() => {
    if (!provider) return
    const next: Record<string, string> = {}
    for (const field of provider.fields) {
      if (field.secret) continue
      next[field.key] = saved?.credentials[field.key] ?? (field.key === 'base_url' ? provider.baseUrl : '')
    }
    setValues(next)
    setIsActive(saved?.isActive ?? true)
  }, [provider, saved])

  if (!provider) return null

  const submit = () => {
    const credentials: Record<string, string> = {}
    for (const field of provider.fields) {
      const value = values[field.key]?.trim() ?? ''
      if (value) credentials[field.key] = value
    }

    save.mutate(
      { providerCode: provider.code, isActive, credentials },
      {
        onSuccess: () => {
          setValues((current) => {
            const cleared = { ...current }
            for (const field of provider.fields) {
              if (field.secret) cleared[field.key] = ''
            }
            return cleared
          })
          showToast([t('settings.channelSaved')])
        },
        onError: (error) => showToast([errorText(error, t('toast.failed'))]),
      },
    )
  }

  return (
    <section className={s.card}>
      <h2>{t('settings.channels')}</h2>
      <p className={s.hint}>{t('settings.channelHint')}</p>

      <Field label={t('settings.provider')} htmlFor="channel-provider">
        <Dropdown
          id="channel-provider"
          label={t('settings.provider')}
          value={provider.code}
          options={providers.map((item) => ({ value: item.code, label: item.label }))}
          onChange={setProviderCode}
        />
      </Field>

      {provider.fields.map((field) => (
        <Field key={field.key} label={t(`settings.channelFields.${field.key}`)} htmlFor={`channel-${field.key}`}>
          <TextInput
            id={`channel-${field.key}`}
            type={field.secret ? 'password' : 'text'}
            autoComplete="off"
            value={values[field.key] ?? ''}
            placeholder={field.secret && saved?.credentials[field.key] ? saved.credentials[field.key] : undefined}
            onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
          />
        </Field>
      ))}

      <Checkbox label={t('settings.channelActive')} checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />

      <Button onClick={submit} disabled={save.isPending}>
        {t('common.save')}
      </Button>

      {(connections.data ?? []).length > 0 ? (
        <ul className={s.list}>
          {connections.data?.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.label}</strong>
                <span>{item.isActive ? t('settings.channelOn') : t('settings.channelOff')}</span>
              </div>
              <Button
                variant="danger"
                onClick={() =>
                  remove.mutate(item.id, {
                    onSuccess: () => showToast([t('settings.channelRemoved')]),
                    onError: (error) => showToast([errorText(error, t('toast.failed'))]),
                  })
                }
              >
                {t('settings.channelRemove')}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
