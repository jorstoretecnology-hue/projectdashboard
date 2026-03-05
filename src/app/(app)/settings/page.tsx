'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { setTheme, theme } = useTheme();

  return (
    <div className="space-y-6 p-4 md:p-10 pb-16 block animate-in fade-in duration-500">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Configuración</h2>
        <p className="text-muted-foreground">
          Administra la configuración de tu cuenta y preferencias.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <div className="flex-1 lg:max-w-3xl">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="account">Cuenta</TabsTrigger>
              <TabsTrigger value="appearance">Apariencia</TabsTrigger>
            </TabsList>
            
            {/* Tab: Perfil */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Perfil Público</CardTitle>
                  <CardDescription>
                    Esta información será visible para otros usuarios.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src="/avatars/01.png" alt="Avatar" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <Button variant="outline">Cambiar Avatar</Button>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre Completo</Label>
                      <Input id="name" placeholder="Tu nombre" defaultValue="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Nombre de Usuario</Label>
                      <Input id="username" placeholder="Usuario" defaultValue="johndoe" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" type="email" placeholder="john@example.com" defaultValue="john.doe@example.com" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Biografía</Label>
                    <Textarea 
                      id="bio" 
                      placeholder="Escribe algo sobre ti..." 
                      className="resize-none min-h-[100px]"
                      defaultValue="Desarrollador Full Stack apasionado por crear experiencias de usuario increíbles."
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Guardar Cambios</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Tab: Cuenta */}
            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Seguridad</CardTitle>
                  <CardDescription>
                    Actualiza tu contraseña y asegura tu cuenta.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current">Contraseña Actual</Label>
                    <Input id="current" type="password" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new">Nueva Contraseña</Label>
                      <Input id="new" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm">Confirmar Contraseña</Label>
                      <Input id="confirm" type="password" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Actualizar Contraseña</Button>
                </CardFooter>
              </Card>

              <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
                  <CardDescription className="text-destructive/80">
                    Estas acciones son irreversibles. Ten cuidado.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive">Eliminar Cuenta</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Apariencia */}
            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tema</CardTitle>
                  <CardDescription>
                    Personaliza la apariencia del dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid max-w-md grid-cols-3 gap-4">
                    <div 
                      className={cn(
                        "cursor-pointer rounded-md border-2 p-1 hover:border-primary transition-all",
                        theme === 'light' ? "border-primary" : "border-muted"
                      )}
                      onClick={() => setTheme('light')}
                    >
                      <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                        <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                          <div className="h-2 w-[40px] rounded-lg bg-[#ecedef]" />
                          <div className="h-2 w-[60px] rounded-lg bg-[#ecedef]" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                          <div className="h-2 w-[60px] rounded-lg bg-[#ecedef]" />
                        </div>
                      </div>
                      <div className="p-2 text-center text-sm font-medium">Claro</div>
                    </div>

                    <div 
                      className={cn(
                        "cursor-pointer rounded-md border-2 p-1 hover:border-primary transition-all",
                        theme === 'dark' ? "border-primary" : "border-muted"
                      )}
                      onClick={() => setTheme('dark')}
                    >
                      <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                        <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                          <div className="h-2 w-[40px] rounded-lg bg-slate-400" />
                          <div className="h-2 w-[60px] rounded-lg bg-slate-400" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-slate-400" />
                          <div className="h-2 w-[60px] rounded-lg bg-slate-400" />
                        </div>
                      </div>
                      <div className="p-2 text-center text-sm font-medium">Oscuro</div>
                    </div>

                    <div 
                      className={cn(
                        "cursor-pointer rounded-md border-2 p-1 hover:border-primary transition-all",
                        theme === 'system' ? "border-primary" : "border-muted"
                      )}
                      onClick={() => setTheme('system')}
                    >
                      <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                        <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                          <div className="h-2 w-[40px] rounded-lg bg-slate-400" />
                          <div className="h-2 w-[60px] rounded-lg bg-slate-400" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-slate-400" />
                          <div className="h-2 w-[60px] rounded-lg bg-slate-400" />
                        </div>
                      </div>
                      <div className="p-2 text-center text-sm font-medium">Sistema</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}