'use client'

import { useState, useEffect, type ReactNode } from 'react'
import Image from 'next/image'

import {
  AlertCircleIcon,
  Car,
  CheckCircle2,
  DollarSign,
  ImageOff,
  Images,
  Loader2,
  MapPin,
  Plus,
  Save,
  Settings2,
  Shield,
  Tag,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

import { cn } from '@/lib/utils'

import {
  VehiclePhotoService,
  type VehicleEditData,
  type VehicleUpdatePayload,
} from '@/services/VehiclePhotoService'

// Constants for form options
const SUCURSALES = [
  'Monterrey',
  'Guadalupe',
  'Guadalupe 2',
  'Reynosa',
  'Saltillo',
  'Las Americas',
]

const GARANTIAS = [
  '365 días',
  '90 días',
  'Agencia',
]

const CARROCERIAS = [
  'SUV',
  'Sedán',
  'Pick Up',
  'Hatchback',
  'Motocicleta',
  'Crossover',
  'Coupé',
  'Van',
  'Wagon',
]

const TRANSMISIONES = [
  'Automático',
  'Manual',
]

const ORDENSTATUS_OPTIONS = [
  'Comprado',
  'Prospecto',
  'Historico',
  'Cancelado',
]

const DEFAULT_PROMOCIONES = [
  'Enganche Bajo',
  'Tasa Preferencial',
  'MSI',
  'Seguro Gratis',
  'Garantía Extendida',
  'Mantenimiento Incluido',
]

type VehicleEditDialogProps = {
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  vehicle: VehicleEditData | null
  onSaved: () => void
  onManagePhotos?: () => void
  className?: string
}

const VehicleEditDialog = ({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  vehicle,
  onSaved,
  onManagePhotos,
  className
}: VehicleEditDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen

  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<VehicleUpdatePayload>({})
  const [selectedPromociones, setSelectedPromociones] = useState<string[]>([])
  const [customPromocion, setCustomPromocion] = useState('')
  const [availablePromociones, setAvailablePromociones] = useState<string[]>(DEFAULT_PROMOCIONES)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load form data when vehicle changes
  useEffect(() => {
    if (vehicle && open) {
      setFormData({
        mensualidad_minima: vehicle.mensualidad_minima,
        mensualidad_recomendada: vehicle.mensualidad_recomendada,
        ubicacion: vehicle.ubicacion,
        garantia: vehicle.garantia,
        carroceria: vehicle.carroceria,
        kilometraje: vehicle.kilometraje,
        transmision: vehicle.transmision,
        ordenstatus: vehicle.ordenstatus || 'Comprado',
      })
      setSelectedPromociones(vehicle.promociones || [])
      setSaveMessage(null)

      // Load unique promociones
      VehiclePhotoService.getUniquePromociones().then(promos => {
        const allPromos = new Set([...DEFAULT_PROMOCIONES, ...promos])
        setAvailablePromociones(Array.from(allPromos).sort())
      })
    }
  }, [vehicle, open])

  const handleInputChange = (field: keyof VehicleUpdatePayload, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSaveMessage(null)
  }

  const handlePromocionToggle = (promo: string, checked: boolean) => {
    if (checked) {
      setSelectedPromociones(prev => [...prev, promo])
    } else {
      setSelectedPromociones(prev => prev.filter(p => p !== promo))
    }
    setSaveMessage(null)
  }

  const handleAddCustomPromocion = () => {
    const trimmed = customPromocion.trim()
    if (trimmed && !availablePromociones.includes(trimmed)) {
      setAvailablePromociones(prev => [...prev, trimmed].sort())
      setSelectedPromociones(prev => [...prev, trimmed])
      setCustomPromocion('')
      setSaveMessage(null)
    }
  }

  const handleSave = async () => {
    if (!vehicle) return

    setSaving(true)
    setSaveMessage(null)

    const payload: VehicleUpdatePayload = {
      ...formData,
      promociones: selectedPromociones.length > 0 ? selectedPromociones : null,
    }

    const result = await VehiclePhotoService.updateVehicleData(vehicle.id, payload)

    setSaving(false)

    if (result.success) {
      setSaveMessage({ type: 'success', text: 'Datos guardados correctamente' })
      onSaved()
      setTimeout(() => {
        setOpen(false)
      }, 1500)
    } else {
      setSaveMessage({ type: 'error', text: result.error || 'Error al guardar' })
    }
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '-'
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (!vehicle) return null

  const dialogContent = (
    <DialogContent
      className={cn(
        'flex max-h-[min(920px,95vh)] flex-col gap-0 p-0 max-sm:max-h-[min(650px,80vh)] md:max-w-3xl [&>[data-slot=dialog-close]>svg]:size-5',
        className
      )}
    >
      <ScrollArea className='flex max-h-full flex-col overflow-hidden'>
        <div className='flex flex-col gap-6 p-6'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 leading-7'>
              <Settings2 className='size-5' />
              Editar Vehículo
            </DialogTitle>
            <div className='flex items-center gap-2 mt-1 flex-wrap text-sm text-muted-foreground'>
              <span className='font-mono text-xs bg-muted px-2 py-1 rounded'>
                {vehicle.ordencompra || 'Sin OC'}
              </span>
              <span className='font-medium'>{vehicle.title}</span>
            </div>
          </DialogHeader>

          {/* Vehicle Info Card (Read-only) */}
          <Card className='bg-muted/30'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                <Car className='size-4' />
                Información del Vehículo (Solo lectura)
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-2 gap-4 text-sm sm:grid-cols-4'>
              <div>
                <p className='text-muted-foreground text-xs'>Marca</p>
                <p className='font-medium'>{vehicle.marca || '-'}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>Modelo</p>
                <p className='font-medium'>{vehicle.modelo || '-'}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>Año</p>
                <p className='font-medium'>{vehicle.autoano || '-'}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>Precio</p>
                <p className='font-medium text-primary'>{formatCurrency(vehicle.precio)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Photo Status Card */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium flex items-center justify-between'>
                <span className='flex items-center gap-2'>
                  <Images className='size-4' />
                  Fotos
                </span>
                {onManagePhotos && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={onManagePhotos}
                    className='gap-2'
                  >
                    <Images className='size-4' />
                    Administrar Fotos
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-center gap-4'>
                {vehicle.thumbnail_url ? (
                  <div className='relative size-24 rounded-lg overflow-hidden bg-muted'>
                    <Image
                      src={vehicle.thumbnail_url}
                      alt={vehicle.title}
                      fill
                      className='object-cover'
                      sizes='96px'
                    />
                  </div>
                ) : (
                  <div className='size-24 rounded-lg bg-muted flex items-center justify-center'>
                    <ImageOff className='size-6 text-muted-foreground' />
                  </div>
                )}
                <div className='flex gap-2 flex-wrap'>
                  {vehicle.has_feature_image ? (
                    <Badge variant='default' className='bg-green-600'>
                      <CheckCircle2 className='size-3 mr-1' />
                      Foto Principal
                    </Badge>
                  ) : (
                    <Badge variant='destructive'>
                      <AlertCircleIcon className='size-3 mr-1' />
                      Sin Foto Principal
                    </Badge>
                  )}
                  {vehicle.has_gallery ? (
                    <Badge variant='secondary'>
                      <Images className='size-3 mr-1' />
                      {vehicle.gallery_count} fotos
                    </Badge>
                  ) : (
                    <Badge variant='outline' className='text-amber-600 border-amber-300'>
                      <ImageOff className='size-3 mr-1' />
                      Sin galería
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editable Fields */}
          <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
            {/* Mensualidad Mínima */}
            <div className='col-span-2 space-y-1'>
              <Label htmlFor='mensualidad_minima' className='flex items-center gap-2'>
                <DollarSign className='size-4' />
                Mensualidad Mínima
              </Label>
              <Input
                id='mensualidad_minima'
                type='number'
                placeholder='0'
                value={formData.mensualidad_minima ?? ''}
                onChange={(e) => handleInputChange('mensualidad_minima', e.target.value ? Number(e.target.value) : null)}
              />
            </div>

            {/* Mensualidad Recomendada */}
            <div className='col-span-2 space-y-1'>
              <Label htmlFor='mensualidad_recomendada' className='flex items-center gap-2'>
                <DollarSign className='size-4' />
                Mensualidad Recomendada
              </Label>
              <Input
                id='mensualidad_recomendada'
                type='number'
                placeholder='0'
                value={formData.mensualidad_recomendada ?? ''}
                onChange={(e) => handleInputChange('mensualidad_recomendada', e.target.value ? Number(e.target.value) : null)}
              />
            </div>

            {/* Sucursal */}
            <div className='col-span-2 space-y-1'>
              <Label htmlFor='ubicacion' className='flex items-center gap-2'>
                <MapPin className='size-4' />
                Sucursal
              </Label>
              <Select
                value={formData.ubicacion || ''}
                onValueChange={(value) => handleInputChange('ubicacion', value)}
              >
                <SelectTrigger id='ubicacion' className='w-full'>
                  <SelectValue placeholder='Seleccionar sucursal' />
                </SelectTrigger>
                <SelectContent>
                  {SUCURSALES.map(suc => (
                    <SelectItem key={suc} value={suc}>{suc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Garantía */}
            <div className='col-span-2 space-y-1'>
              <Label htmlFor='garantia' className='flex items-center gap-2'>
                <Shield className='size-4' />
                Garantía
              </Label>
              <Select
                value={formData.garantia || ''}
                onValueChange={(value) => handleInputChange('garantia', value)}
              >
                <SelectTrigger id='garantia' className='w-full'>
                  <SelectValue placeholder='Seleccionar garantía' />
                </SelectTrigger>
                <SelectContent>
                  {GARANTIAS.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Carrocería */}
            <div className='space-y-1'>
              <Label htmlFor='carroceria'>Carrocería</Label>
              <Select
                value={formData.carroceria || ''}
                onValueChange={(value) => handleInputChange('carroceria', value)}
              >
                <SelectTrigger id='carroceria'>
                  <SelectValue placeholder='Seleccionar' />
                </SelectTrigger>
                <SelectContent>
                  {CARROCERIAS.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Kilometraje */}
            <div className='space-y-1'>
              <Label htmlFor='kilometraje'>Kilometraje</Label>
              <Input
                id='kilometraje'
                type='number'
                placeholder='0'
                value={formData.kilometraje ?? ''}
                onChange={(e) => handleInputChange('kilometraje', e.target.value ? Number(e.target.value) : null)}
              />
            </div>

            {/* Transmisión */}
            <div className='space-y-1'>
              <Label htmlFor='transmision'>Transmisión</Label>
              <Select
                value={formData.transmision || ''}
                onValueChange={(value) => handleInputChange('transmision', value)}
              >
                <SelectTrigger id='transmision'>
                  <SelectValue placeholder='Seleccionar' />
                </SelectTrigger>
                <SelectContent>
                  {TRANSMISIONES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estado de Orden */}
            <div className='space-y-1'>
              <Label htmlFor='ordenstatus'>Estado</Label>
              <Select
                value={formData.ordenstatus || 'Comprado'}
                onValueChange={(value) => handleInputChange('ordenstatus', value)}
              >
                <SelectTrigger id='ordenstatus'>
                  <SelectValue placeholder='Seleccionar' />
                </SelectTrigger>
                <SelectContent>
                  {ORDENSTATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Promociones */}
          <div className='space-y-3'>
            <Label className='flex items-center gap-2'>
              <Tag className='size-4' />
              Promociones
            </Label>
            <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
              {availablePromociones.map(promo => (
                <div key={promo} className='flex items-center space-x-2'>
                  <Checkbox
                    id={`promo-${promo}`}
                    checked={selectedPromociones.includes(promo)}
                    onCheckedChange={(checked) => handlePromocionToggle(promo, checked as boolean)}
                  />
                  <label
                    htmlFor={`promo-${promo}`}
                    className='text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                  >
                    {promo}
                  </label>
                </div>
              ))}
            </div>
            <div className='flex gap-2 mt-2'>
              <Input
                placeholder='Nueva promoción...'
                value={customPromocion}
                onChange={(e) => setCustomPromocion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCustomPromocion()
                  }
                }}
                className='flex-1'
              />
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={handleAddCustomPromocion}
                disabled={!customPromocion.trim()}
              >
                <Plus className='size-4' />
              </Button>
            </div>
          </div>

          {/* Save message */}
          {saveMessage && (
            <Alert
              variant={saveMessage.type === 'error' ? 'destructive' : 'default'}
              className={saveMessage.type === 'success' ? 'bg-green-50 border-green-200' : ''}
            >
              {saveMessage.type === 'success' ? (
                <CheckCircle2 className='size-4 text-green-600' />
              ) : (
                <AlertCircleIcon className='size-4' />
              )}
              <AlertDescription className={saveMessage.type === 'success' ? 'text-green-700' : ''}>
                {saveMessage.text}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className='flex-row gap-4 pt-2'>
            <Button size='lg' onClick={handleSave} disabled={saving} className='gap-2'>
              {saving ? (
                <>
                  <Loader2 className='size-4 animate-spin' />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className='size-4' />
                  Guardar Cambios
                </>
              )}
            </Button>
            <DialogClose asChild>
              <Button variant='outline' size='lg' disabled={saving}>
                Cancelar
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </ScrollArea>
    </DialogContent>
  )

  // If trigger is provided, wrap in Dialog with trigger
  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild onClick={() => setOpen(true)}>
          {trigger}
        </DialogTrigger>
        {dialogContent}
      </Dialog>
    )
  }

  // Otherwise, just render the dialog (controlled mode)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {dialogContent}
    </Dialog>
  )
}

export default VehicleEditDialog
