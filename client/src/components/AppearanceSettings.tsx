import { useState, useEffect } from "react";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mapeo de tamaños de fuente
const fontSizeMap: Record<string, string> = {
  small: '0.875rem',
  medium: '1rem',
  large: '1.125rem'
};

// Define the schema for the appearance settings
const appearanceFormSchema = z.object({
  // Theme settings
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
    message: "Please enter a valid hex color code, e.g. #3B82F6",
  }),
  themeVariant: z.enum(["professional", "tint", "vibrant"]),
  themeMode: z.enum(["light", "dark", "system"]),
  borderRadius: z.number().min(0).max(2),
  
  // Font settings
  fontFamily: z.string(),
  fontSize: z.enum(["small", "medium", "large"]),
  
  // Layout settings
  compactMode: z.boolean(),
  animationsEnabled: z.boolean(),
  highContrastMode: z.boolean()
});

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;

export default function AppearanceSettings() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Default values from theme.json, could be loaded from user preferences
  // These would typically come from a user settings API
  const defaultValues: AppearanceFormValues = {
    primaryColor: "#3B82F6", // blue-500
    themeVariant: "vibrant",
    themeMode: "light",
    borderRadius: 1,
    fontFamily: "system-ui",
    fontSize: "medium",
    compactMode: false,
    animationsEnabled: true,
    highContrastMode: false
  };
  
  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues,
  });
  
  // Preview of selected color
  const selectedColor = form.watch("primaryColor");
  const selectedThemeMode = form.watch("themeMode");
  const selectedBorderRadius = form.watch("borderRadius");
  
  const onSubmit = async (data: AppearanceFormValues) => {
    setIsSubmitting(true);
    
    try {
      console.log("Guardando configuración de apariencia:", data);
      
      // Crear objeto de configuración del tema
      const themeConfig = {
        variant: data.themeVariant,
        primary: data.primaryColor,
        appearance: data.themeMode,
        radius: data.borderRadius
      };
      
      // Guardar tema y otras preferencias en localStorage para aplicarlo inmediatamente
      localStorage.setItem('user-theme', JSON.stringify(themeConfig));
      localStorage.setItem('user-font-family', data.fontFamily);
      
      // Guardar el tamaño de fuente en formato CSS
      localStorage.setItem('user-font-size', fontSizeMap[data.fontSize]);
      
      // Guardar otros ajustes como valores booleanos
      localStorage.setItem('compact-mode', data.compactMode ? 'true' : 'false');
      localStorage.setItem('animations-disabled', !data.animationsEnabled ? 'true' : 'false');
      localStorage.setItem('high-contrast', data.highContrastMode ? 'true' : 'false');
      
      // Aplicar cambios inmediatamente (sin necesidad de recargar)
      document.documentElement.style.setProperty('--primary', data.primaryColor);
      document.documentElement.setAttribute('data-theme-radius', data.borderRadius.toString());
      document.documentElement.setAttribute('data-theme-appearance', data.themeMode);
      document.documentElement.setAttribute('data-theme-variant', data.themeVariant);
      
      // Aplicar familia de fuente
      document.documentElement.style.setProperty('--font-family', data.fontFamily);
      
      // Aplicar tamaño de fuente
      document.documentElement.style.setProperty('--font-size-base', fontSizeMap[data.fontSize]);
      
      // Aplicar configuración de animaciones
      if (!data.animationsEnabled) {
        document.documentElement.classList.add('no-animations');
      } else {
        document.documentElement.classList.remove('no-animations');
      }
      
      // Aplicar modo compacto
      if (data.compactMode) {
        document.documentElement.classList.add('compact-mode');
      } else {
        document.documentElement.classList.remove('compact-mode');
      }
      
      // Aplicar modo alto contraste
      if (data.highContrastMode) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
      
      // Simular tiempo de guardado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Apariencia actualizada",
        description: "Tus preferencias de apariencia han sido guardadas y aplicadas.",
      });
      
    } catch (error) {
      console.error("Error al guardar configuración de apariencia:", error);
      toast({
        title: "Error al guardar configuración",
        description: "Hubo un problema al guardar tus preferencias de apariencia.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personaliza la Apariencia</CardTitle>
        <CardDescription>Personaliza la apariencia de la aplicación según tus preferencias.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Tabs defaultValue="theme" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="theme">Tema</TabsTrigger>
                <TabsTrigger value="fonts">Fuentes</TabsTrigger>
                <TabsTrigger value="layout">Diseño</TabsTrigger>
              </TabsList>
              
              {/* Theme Settings */}
              <TabsContent value="theme" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color Principal</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Input {...field} type="text" onChange={(e) => {
                                field.onChange(e.target.value);
                                // Actualizar el color directamente para vista previa instantánea
                                if (e.target.value.match(/^#[0-9A-Fa-f]{6}$/)) {
                                  document.documentElement.style.setProperty('--primary', e.target.value);
                                }
                              }} />
                            </FormControl>
                            <FormControl>
                              <Input 
                                type="color" 
                                value={field.value} 
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  // Actualizar el color directamente para vista previa instantánea
                                  document.documentElement.style.setProperty('--primary', e.target.value);
                                }}
                                className="w-12 h-10 p-1 cursor-pointer" 
                              />
                            </FormControl>
                          </div>
                          <div className="mt-4 space-y-2">
                            <FormDescription className="mb-2">
                              Selecciona un color predefinido o ingresa un código hexadecimal
                            </FormDescription>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { color: "#3B82F6", name: "Azul" },
                                { color: "#10B981", name: "Verde" },
                                { color: "#EF4444", name: "Rojo" },
                                { color: "#F59E0B", name: "Naranja" },
                                { color: "#8B5CF6", name: "Morado" },
                                { color: "#EC4899", name: "Rosa" }
                              ].map(({ color, name }) => (
                                <Button
                                  key={color}
                                  type="button"
                                  variant="outline"
                                  className="h-8 px-2"
                                  onClick={() => {
                                    field.onChange(color);
                                    // Actualizar el color directamente para vista previa instantánea
                                    document.documentElement.style.setProperty('--primary', color);
                                  }}
                                  style={{ backgroundColor: color, borderColor: color }}
                                  title={name}
                                >
                                  <span className="sr-only">{name}</span>
                                </Button>
                              ))}
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <FormField
                      control={form.control}
                      name="themeVariant"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel>Variante del Tema</FormLabel>
                          <FormDescription>
                            Selecciona cómo se aplican los colores en la aplicación
                          </FormDescription>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="professional" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Profesional - Colores sutiles y elegantes
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="tint" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Tinte - Colores suaves y equilibrados
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="vibrant" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Vibrante - Colores vivos y llamativos
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <FormField
                      control={form.control}
                      name="themeMode"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel>Modo del Tema</FormLabel>
                          <FormDescription>
                            Elige entre modo claro, oscuro o según la configuración del sistema
                          </FormDescription>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="light" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Claro
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="dark" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Oscuro
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="system" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Sistema (usar configuración del dispositivo)
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <FormField
                      control={form.control}
                      name="borderRadius"
                      render={({ field: { value, onChange } }) => (
                        <FormItem>
                          <FormLabel>Radio de Bordes: {value}</FormLabel>
                          <FormControl>
                            <Slider
                              min={0}
                              max={2}
                              step={0.1}
                              value={[value]}
                              onValueChange={(vals) => onChange(vals[0])}
                              className="w-full"
                            />
                          </FormControl>
                          <FormDescription>
                            Ajusta el radio de los bordes de los elementos (0 = cuadrado, 2 = redondeado)
                          </FormDescription>
                          <div className="flex items-center justify-between mt-2">
                            <div>Cuadrado</div>
                            <div>Redondeado</div>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {/* Preview of border radius */}
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Vista previa:</div>
                      <div 
                        className="w-full h-20 bg-primary flex items-center justify-center text-white"
                        style={{ 
                          borderRadius: `${selectedBorderRadius * 0.5}rem`,
                          backgroundColor: selectedColor,
                        }}
                      >
                        Vista previa del borde
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Fonts Settings */}
              <TabsContent value="fonts" className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fontFamily"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Familia de Fuente</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Aplicar cambio de fuente inmediatamente
                            document.documentElement.style.setProperty('--font-family', value);
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una fuente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="system-ui">Predeterminada del Sistema</SelectItem>
                            <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                            <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                            <SelectItem value="'Helvetica Neue', sans-serif">Helvetica Neue</SelectItem>
                            <SelectItem value="'Segoe UI', sans-serif">Segoe UI</SelectItem>
                            <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                            <SelectItem value="'Georgia', serif">Georgia</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Selecciona la familia de fuente para toda la aplicación
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fontSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tamaño de Fuente</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Aplicar cambio de tamaño de fuente inmediatamente
                            document.documentElement.style.setProperty('--font-size-base', fontSizeMap[value]);
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un tamaño" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="small">Pequeño</SelectItem>
                            <SelectItem value="medium">Mediano</SelectItem>
                            <SelectItem value="large">Grande</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Configura el tamaño base de texto en toda la aplicación
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  {/* Font preview */}
                  <div className="mt-6 p-4 border rounded-md">
                    <h3 className="text-lg font-semibold mb-2">Vista previa:</h3>
                    <div 
                      style={{ 
                        fontFamily: form.watch("fontFamily"),
                        fontSize: form.watch("fontSize") === "small" ? "0.875rem" : 
                                form.watch("fontSize") === "medium" ? "1rem" : "1.125rem"
                      }}
                    >
                      <p className="mb-2">Este es un texto de ejemplo para que veas cómo se aplica la fuente seleccionada.</p>
                      <p className="font-bold">Este texto está en negrita para mostrar los diferentes estilos.</p>
                      <p className="italic">Este texto está en cursiva para mostrar los diferentes estilos.</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Layout Settings */}
              <TabsContent value="layout" className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="compactMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Modo Compacto</FormLabel>
                          <FormDescription>
                            Reduce el espaciado para mostrar más contenido en la pantalla
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              // Aplicar modo compacto inmediatamente
                              if (checked) {
                                document.documentElement.classList.add('compact-mode');
                              } else {
                                document.documentElement.classList.remove('compact-mode');
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="animationsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Animaciones</FormLabel>
                          <FormDescription>
                            Habilita o deshabilita las animaciones en la interfaz
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              // Aplicar configuración de animaciones inmediatamente
                              if (!checked) {
                                document.documentElement.classList.add('no-animations');
                              } else {
                                document.documentElement.classList.remove('no-animations');
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="highContrastMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Modo de Alto Contraste</FormLabel>
                          <FormDescription>
                            Mejora la legibilidad con mayor contraste entre los elementos
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              // Aplicar modo alto contraste inmediatamente
                              if (checked) {
                                document.documentElement.classList.add('high-contrast');
                              } else {
                                document.documentElement.classList.remove('high-contrast');
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <CardFooter className="flex justify-end px-0">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Cambios de Apariencia"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}