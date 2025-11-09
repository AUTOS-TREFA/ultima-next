"use client";

import { motion } from "motion/react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2 flex-1">
              <Icon icon="solar:car-bold" className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl">Autos TREFA</span>
            </div>
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium justify-center">
              <a
                href="#inventario"
                className="text-foreground/60 hover:text-foreground transition-colors"
              >
                Inventario
              </a>
              <a
                href="#servicios"
                className="text-foreground/60 hover:text-foreground transition-colors"
              >
                Servicios
              </a>
              <a
                href="#financiamiento"
                className="text-foreground/60 hover:text-foreground transition-colors"
              >
                Financiamiento
              </a>
              <a
                href="#testimonios"
                className="text-foreground/60 hover:text-foreground transition-colors"
              >
                Testimonios
              </a>
              <a
                href="#contacto"
                className="text-foreground/60 hover:text-foreground transition-colors"
              >
                Contacto
              </a>
            </nav>
            <div className="flex items-center space-x-2 flex-1 justify-end">
              <Button size="sm" variant="ghost">
                Iniciar Sesión
              </Button>
              <Button size="sm">Contactar</Button>
            </div>
          </div>
        </div>
      </header>
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-32 top-1/2 transform -translate-y-1/2 opacity-20 scale-150">
            <img
              src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/placeholder/square.png"
              alt="Modern SUV"
              className="w-96 h-64 object-contain"
            />
          </div>
          <div className="absolute -left-32 top-1/2 transform -translate-y-1/2 opacity-20 scale-150">
            <img
              src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/placeholder/square.png"
              alt="Modern SUV"
              className="w-96 h-64 object-contain scale-x-[-1]"
            />
          </div>
        </div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-gradient-to-t to-transparent blur-3xl rounded-t-full from-primary/20 translate-y-1/2 w-[80%] h-96" />
        <div className="container mx-auto px-4 lg:px-6 relative z-10">
          <div className="flex flex-col items-center text-center space-y-8">
            <Badge
              variant="outline"
              className="px-4 py-1 bg-gradient-to-r from-primary/10 to-secondary/5 border-primary/30 hover:from-primary/20 hover:to-secondary/10 hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <Icon icon="solar:shield-check-bold" className="w-3 h-3 mr-1 text-primary" />
              Autos Seminuevos Certificados
            </Badge>
            <motion.h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight max-w-4xl">
              Tu Próximo Auto Seminuevo Te Está Esperando
            </motion.h1>
            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Encuentra el auto perfecto en nuestra selección de vehículos seminuevos 2019 en
              adelante. SUVs, Sedanes, Hatchbacks y Pick Ups con garantía y financiamiento
              disponible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" variant="outline" className="px-8">
                Ver Inventario
                <Icon icon="solar:car-bold" className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" className="px-8">
                Cotizar Ahora
                <Icon icon="solar:calculator-bold" className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="flex flex-col items-center space-y-4 mt-10">
              <p className="text-sm text-muted-foreground">
                Más de 500 autos vendidos y clientes satisfechos
              </p>
              <div className="flex items-center space-x-8 opacity-60 flex-wrap justify-center gap-y-4 gap-x-[10px] mt-4">
                <div className="flex items-center space-x-2">
                  <img
                    src="https://logos-world.net/wp-content/uploads/2021/03/Honda-Logo.png"
                    alt="Honda"
                    className="h-8 w-auto opacity-70"
                  />
                  <span className="text-lg font-semibold">Honda</span>
                </div>
                <div className="flex items-center space-x-2">
                  <img
                    src="https://logos-world.net/wp-content/uploads/2020/09/Toyota-Logo.png"
                    alt="Toyota"
                    className="h-8 w-auto opacity-70"
                  />
                  <span className="text-lg font-semibold">Toyota</span>
                </div>
                <div className="flex items-center space-x-2">
                  <img
                    src="https://logos-world.net/wp-content/uploads/2020/09/Nissan-Logo.png"
                    alt="Nissan"
                    className="h-8 w-auto opacity-70"
                  />
                  <span className="text-lg font-semibold">Nissan</span>
                </div>
                <div className="flex items-center space-x-2">
                  <img
                    src="https://logos-world.net/wp-content/uploads/2020/09/Mazda-Logo.png"
                    alt="Mazda"
                    className="h-8 w-auto opacity-70"
                  />
                  <span className="text-lg font-semibold">Mazda</span>
                </div>
                <div className="flex items-center space-x-2">
                  <img
                    src="https://logos-world.net/wp-content/uploads/2020/09/Hyundai-Logo.png"
                    alt="Hyundai"
                    className="h-8 w-auto opacity-70"
                  />
                  <span className="text-lg font-semibold">Hyundai</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">Conoce Autos TREFA</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Descubre por qué somos la mejor opción para tu próximo auto seminuevo
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5 shadow-xl">
              <CardContent className="p-0">
                <div className="aspect-video bg-muted/50 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Icon
                      icon="solar:play-circle-bold"
                      className="w-16 h-16 text-primary mx-auto"
                    />
                    <p className="text-lg font-semibold">Video Presentación</p>
                    <p className="text-muted-foreground">
                      Conoce nuestras instalaciones y proceso de venta
                    </p>
                    <Button className="mt-4">Reproducir Video</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <section id="inventario" className="border-t bg-muted/50 py-20 md:py-32">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">Nuestro Inventario</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Vehículos seminuevos 2019 en adelante, inspeccionados y con garantía
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <Card className="shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5 md:col-span-2 lg:col-span-3 md:row-span-2">
              <CardContent className="p-0">
                <img
                  src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/photos/commercial-listings/landscape/4.webp"
                  alt="SUVs Premium"
                  className="w-full h-96 object-cover rounded-t-xl"
                />
                <div className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon icon="solar:car-bold" className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-xl mb-3">SUVs Premium</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Amplia selección de SUVs seminuevos con tecnología avanzada, espacios amplios y
                    máxima seguridad para toda la familia. Modelos 2019-2024 disponibles.
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">Desde $350,000</span>
                    <Button size="sm">Ver Modelos</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5 md:col-span-2 lg:col-span-3">
              <CardContent className="p-0">
                <img
                  src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/photos/commercial-listings/landscape/2.webp"
                  alt="Sedanes Ejecutivos"
                  className="w-full h-32 object-cover rounded-t-xl"
                />
                <div className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon icon="solar:star-bold" className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-xl mb-2">Sedanes Ejecutivos</h3>
                  <p className="text-muted-foreground">
                    Elegancia y confort en cada viaje con nuestros sedanes premium.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5 md:col-span-2 lg:col-span-3">
              <CardContent className="p-0">
                <img
                  src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/generation-assets/photos/commercial-listings/landscape/5.webp"
                  alt="Hatchbacks Urbanos"
                  className="w-full h-32 object-cover rounded-t-xl"
                />
                <div className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon icon="solar:city-bold" className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">Hatchbacks Urbanos</h3>
                  <p className="text-muted-foreground text-sm">
                    Perfectos para la ciudad con excelente rendimiento de combustible y fácil
                    estacionamiento.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5 md:col-span-2 lg:col-span-2">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon icon="solar:delivery-bold" className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-xl mb-2">Pick Ups de Trabajo</h3>
                <p className="text-muted-foreground">
                  Resistencia y capacidad para tus proyectos más exigentes.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5 md:col-span-2">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon icon="solar:shield-check-bold" className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-xl mb-2">Garantía Extendida</h3>
                <p className="text-muted-foreground">
                  Todos nuestros vehículos incluyen garantía de 6 meses o 10,000 km.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5 md:col-span-2">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon icon="solar:document-text-bold" className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-xl mb-2">Historial Verificado</h3>
                <p className="text-muted-foreground">
                  Cada auto cuenta con historial vehicular completo y verificado.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <section id="servicios" className="py-20 md:py-32">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              ¿Por Qué Elegir Autos TREFA?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comparamos las opciones para que tomes la mejor decisión al comprar tu auto seminuevo
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
            <Card className="relative border-2 bg-gradient-to-br from-red-50 to-red-100 border-red-300">
              <CardContent>
                <div className="space-y-1">
                  <h3 className="font-semibold text-xl text-left text-red-700">
                    Loteros Tradicionales
                  </h3>
                  <p className="text-red-600 text-left">Riesgos y limitaciones</p>
                </div>
                <div className="flex items-baseline gap-2 mt-6">
                  <div className="text-4xl font-bold text-left text-red-700">❌</div>
                  <div className="text-red-600 text-left">Múltiples riesgos</div>
                </div>
                <div className="mt-8 mb-6">
                  <Button
                    variant="outline"
                    className="w-full border-red-400 text-red-700 hover:bg-red-50"
                    disabled
                  >
                    No Recomendado
                  </Button>
                </div>
                <Separator className="mb-6" />
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:close-circle-bold" className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">Sin garantía real</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:close-circle-bold" className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">Historial dudoso</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:close-circle-bold" className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">Precios inflados</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:close-circle-bold" className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">Comisiones ocultas</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:close-circle-bold" className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">Financiamiento limitado</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:close-circle-bold" className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">Autos en mal estado</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:close-circle-bold" className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">Documentación irregular</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:close-circle-bold" className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">Sin servicio post-venta</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:close-circle-bold" className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">Presión de venta</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="relative border-4 border-primary shadow-2xl scale-110 bg-white z-10">
              <Badge className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">
                <Icon icon="solar:crown-bold" className="w-4 h-4 mr-1" />
                LA MEJOR OPCIÓN
              </Badge>
              <CardContent>
                <div className="space-y-1">
                  <h3 className="font-semibold text-xl text-left text-primary">Autos TREFA</h3>
                  <p className="text-muted-foreground text-left">Confianza y profesionalismo</p>
                </div>
                <div className="flex items-baseline gap-2 mt-6">
                  <div className="text-4xl font-bold text-left text-primary">✅</div>
                  <div className="text-muted-foreground text-left">Máxima seguridad</div>
                </div>
                <div className="mt-8 mb-6">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    ¡Elige TREFA!
                  </Button>
                </div>
                <Separator className="mb-6" />
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-primary" />
                    <span className="text-foreground font-medium">Garantía de 6 meses</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-primary" />
                    <span className="text-foreground font-medium">Historial 100% verificado</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-primary" />
                    <span className="text-foreground font-medium">
                      Precios justos y transparentes
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-primary" />
                    <span className="text-foreground font-medium">0% comisiones ocultas</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-primary" />
                    <span className="text-foreground font-medium">Financiamiento desde 8.9%</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-primary" />
                    <span className="text-foreground font-medium">Inspección de 150 puntos</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-primary" />
                    <span className="text-foreground font-medium">Servicio post-venta</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-primary" />
                    <span className="text-foreground font-medium">Intercambios aceptados</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-primary" />
                    <span className="text-foreground font-medium">Documentación legal</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-primary" />
                    <span className="text-foreground font-medium">Asesoría personalizada</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-primary" />
                    <span className="text-foreground font-medium">Seguros incluidos</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="relative border-2 bg-gradient-to-br from-red-50 to-red-100 border-red-300">
              <CardContent>
                <div className="space-y-1">
                  <h3 className="font-semibold text-xl text-left text-red-700">
                    Particulares/Desconocidos
                  </h3>
                  <p className="text-red-600 text-left">Riesgos considerables</p>
                </div>
                <div className="flex items-baseline gap-2 mt-6">
                  <div className="text-4xl font-bold text-left text-red-700">⚠️</div>
                  <div className="text-red-600 text-left">Alto riesgo</div>
                </div>
                <div className="mt-8 mb-6">
                  <Button
                    variant="outline"
                    className="w-full border-red-400 text-red-700 hover:bg-red-50"
                    disabled
                  >
                    Riesgoso
                  </Button>
                </div>
                <Separator className="mb-6" />
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:danger-bold" className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">Sin garantía alguna</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:danger-bold" className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">Historial desconocido</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:danger-bold" className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">Posibles fraudes</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:danger-bold" className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">Sin financiamiento</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:danger-bold" className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">Trámites complicados</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:danger-bold" className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">Autos robados/chocados</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:danger-bold" className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">Problemas legales</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:danger-bold" className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">Sin respaldo</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon icon="solar:danger-bold" className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">Pérdida de dinero</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="bg-gradient-to-r from-primary/10 to-secondary/5 border border-primary/30 rounded-2xl p-8 text-center">
            <h3 className="font-heading text-2xl font-bold text-primary mb-4">
              La Diferencia TREFA es Clara
            </h3>
            <p className="text-lg text-muted-foreground mb-6">
              Mientras otros te exponen a riesgos, nosotros te brindamos seguridad, garantía y el
              mejor servicio del mercado
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white border border-primary/20 rounded-lg p-6 shadow-md">
                <Icon
                  icon="solar:shield-check-bold"
                  className="w-12 h-12 text-primary mx-auto mb-3"
                />
                <h4 className="font-semibold text-lg mb-2 text-primary">Protección Total</h4>
                <p className="text-muted-foreground text-sm">
                  Garantía, seguro y respaldo legal en cada compra
                </p>
              </div>
              <div className="bg-white border border-primary/20 rounded-lg p-6 shadow-md">
                <Icon
                  icon="solar:user-heart-bold"
                  className="w-12 h-12 text-primary mx-auto mb-3"
                />
                <h4 className="font-semibold text-lg mb-2 text-primary">Servicio Personalizado</h4>
                <p className="text-muted-foreground text-sm">
                  Te acompañamos desde la elección hasta después de la compra
                </p>
              </div>
              <div className="bg-white border border-primary/20 rounded-lg p-6 shadow-md">
                <Icon
                  icon="solar:medal-star-bold"
                  className="w-12 h-12 text-primary mx-auto mb-3"
                />
                <h4 className="font-semibold text-lg mb-2 text-primary">Calidad Garantizada</h4>
                <p className="text-muted-foreground text-sm">
                  Solo vehículos 2019+ con inspección de 150 puntos
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="testimonios" className="py-20 bg-muted/50 md:py-32">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              Lo Que Dicen Nuestros Clientes
            </h2>
            <p className="text-xl text-muted-foreground mx-auto">
              Más de 500 familias han encontrado su auto ideal con nosotros
            </p>
          </div>
          <div className="grid gap-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 shadow-lg">
                <CardContent>
                  <div className="flex items-center space-x-1 mb-4">
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-muted-foreground mb-6">
                    "Excelente servicio desde el primer contacto. Mi Honda CR-V 2021 llegó en
                    perfectas condiciones y el financiamiento fue muy accesible. Totalmente
                    recomendado."
                  </p>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage
                        src="https://randomuser.me/api/portraits/women/32.jpg"
                        className="object-cover"
                      />
                      <AvatarFallback>MG</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">María González</div>
                      <div className="text-sm text-muted-foreground">Honda CR-V 2021</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 shadow-lg">
                <CardContent>
                  <div className="flex items-center space-x-1 mb-4">
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-muted-foreground mb-6">
                    "El proceso de intercambio fue muy transparente. Recibí un precio justo por mi
                    auto anterior y encontré la pick-up perfecta para mi negocio. Muy
                    profesionales."
                  </p>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage
                        src="https://randomuser.me/api/portraits/men/45.jpg"
                        className="object-cover"
                      />
                      <AvatarFallback>CR</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">Carlos Ramírez</div>
                      <div className="text-sm text-muted-foreground">Nissan Frontier 2020</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 shadow-lg">
                <CardContent>
                  <div className="flex items-center space-x-1 mb-4">
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-muted-foreground mb-6">
                    "Como madre soltera, necesitaba un auto confiable y económico. El equipo de
                    TREFA me ayudó a encontrar el financiamiento perfecto para mi Mazda CX-5."
                  </p>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage
                        src="https://randomuser.me/api/portraits/women/28.jpg"
                        className="object-cover"
                      />
                      <AvatarFallback>AL</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">Ana López</div>
                      <div className="text-sm text-muted-foreground">Mazda CX-5 2022</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="gap-8 grid md:grid-cols-2">
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 shadow-lg">
                <CardContent>
                  <div className="flex items-center space-x-1 mb-4">
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-muted-foreground mb-6">
                    "Compré mi Hyundai Tucson 2023 y quedé impresionado con la calidad del vehículo.
                    Se nota que hacen una inspección muy detallada antes de vender."
                  </p>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage
                        src="https://randomuser.me/api/portraits/men/38.jpg"
                        className="object-cover"
                      />
                      <AvatarFallback>JM</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">Jorge Martínez</div>
                      <div className="text-sm text-muted-foreground">Hyundai Tucson 2023</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 shadow-lg">
                <CardContent>
                  <div className="flex items-center space-x-1 mb-4">
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-muted-foreground mb-6">
                    "El servicio post-venta es excelente. Cuando tuve una pequeña duda sobre mi
                    Toyota Corolla, me atendieron inmediatamente y resolvieron todo sin costo."
                  </p>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage
                        src="https://randomuser.me/api/portraits/women/41.jpg"
                        className="object-cover"
                      />
                      <AvatarFallback>LF</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">Lucía Fernández</div>
                      <div className="text-sm text-muted-foreground">Toyota Corolla 2021</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      <section id="faq" className="py-20 md:py-32">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">Preguntas Frecuentes</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Todo lo que necesitas saber sobre comprar tu auto seminuevo en TREFA
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" className="space-y-4" collapsible>
              <AccordionItem value="item-1" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left font-semibold">
                  ¿Qué años de vehículos manejan?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Nos especializamos en vehículos seminuevos del 2019 en adelante. Todos nuestros
                  autos pasan por una inspección rigurosa de 150 puntos para garantizar su calidad y
                  confiabilidad.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left font-semibold">
                  ¿Qué incluye la garantía?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Todos nuestros vehículos incluyen garantía de 6 meses o 10,000 kilómetros (lo que
                  ocurra primero) que cubre motor, transmisión y componentes principales. También
                  ofrecemos garantías extendidas opcionales.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left font-semibold">
                  ¿Puedo financiar mi auto?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Sí, trabajamos con múltiples instituciones financieras para ofrecerte las mejores
                  tasas desde 8.9% anual. Manejamos plazos de hasta 60 meses y enganches desde 20%.
                  La precalificación toma menos de 24 horas.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left font-semibold">
                  ¿Reciben autos en intercambio?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  ¡Por supuesto! Recibimos cualquier marca y modelo como parte de pago. Realizamos
                  una evaluación gratuita y transparente de tu vehículo actual para ofrecerte el
                  mejor precio del mercado.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left font-semibold">
                  ¿Qué documentos necesito para comprar?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Necesitas identificación oficial, comprobante de ingresos, comprobante de
                  domicilio y referencias personales. Si vas a financiar, también requerimos estados
                  de cuenta bancarios. Nosotros nos encargamos de todos los trámites legales.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-6" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left font-semibold">
                  ¿Ofrecen servicio post-venta?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Sí, contamos con servicio post-venta completo incluyendo mantenimiento preventivo,
                  reparaciones menores y asesoría técnica. También te ayudamos con seguros de auto y
                  trámites adicionales que puedas necesitar.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>
      <section className="py-20 bg-primary text-primary-foreground md:py-32 relative overflow-hidden">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              ¿Listo Para Encontrar Tu Auto Ideal?
            </h2>
            <p className="text-xl opacity-90 leading-relaxed">
              Visita nuestro showroom o agenda una cita para conocer nuestro inventario de autos
              seminuevos. Te ayudamos a encontrar el vehículo perfecto para ti y tu familia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" variant="secondary" className="px-8">
                Ver Inventario
                <Icon icon="solar:car-bold" className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                Agendar Cita
                <Icon icon="solar:calendar-bold" className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <p className="text-sm opacity-75">
              Financiamiento disponible • Garantía incluida • Intercambios aceptados
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-gradient-to-t to-transparent blur-3xl rounded-t-full from-primary-foreground/20 w-210 translate-y-1/2 h-64" />
      </section>
      <footer id="contacto" className="py-16 border-t">
        <div className="container mx-auto px-4 lg:px-6" />
      </footer>
    </div>
  );
}

