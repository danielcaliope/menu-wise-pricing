import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CepLookupProps {
  onFactorChange: (factor: number, state: string, city: string) => void;
}

interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export function CepLookup({ onFactorChange }: CepLookupProps) {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationData, setLocationData] = useState<{
    city: string;
    state: string;
    stateCode: string;
    factor: number;
  } | null>(null);

  const handleCepChange = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/\D/g, "");
    // Format as XXXXX-XXX
    if (numericValue.length <= 5) {
      setCep(numericValue);
    } else {
      setCep(`${numericValue.slice(0, 5)}-${numericValue.slice(5, 8)}`);
    }
  };

  const fetchCepData = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    
    if (cleanCep.length !== 8) {
      toast.error("CEP deve ter 8 dígitos");
      return;
    }

    setLoading(true);
    
    try {
      // Fetch from ViaCEP API
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data: CepData = await response.json();
      
      if (data.erro) {
        toast.error("CEP não encontrado");
        setLocationData(null);
        return;
      }

      // Get regional factor from database
      const { data: factorData, error } = await supabase
        .from("regional_factors")
        .select("factor, state_name")
        .eq("state_code", data.uf)
        .single();

      if (error) {
        console.error("Error fetching regional factor:", error);
        toast.error("Erro ao buscar fator regional");
        return;
      }

      const locationInfo = {
        city: data.localidade,
        state: factorData.state_name,
        stateCode: data.uf,
        factor: Number(factorData.factor),
      };

      setLocationData(locationInfo);
      onFactorChange(locationInfo.factor, locationInfo.state, locationInfo.city);
      
      toast.success(`Fator regional aplicado: ${(locationInfo.factor * 100 - 100).toFixed(1)}%`);
    } catch (error) {
      console.error("Error fetching CEP:", error);
      toast.error("Erro ao consultar CEP");
      setLocationData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      fetchCepData();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="cep" className="text-base font-semibold flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Consultar CEP para Fator Regional
        </Label>
        <p className="text-sm text-muted-foreground mb-3">
          Informe o CEP para ajustar o preço baseado na região
        </p>
        
        <div className="flex gap-2">
          <Input
            id="cep"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => handleCepChange(e.target.value)}
            onKeyPress={handleKeyPress}
            maxLength={9}
            className="max-w-xs"
          />
          <Button 
            onClick={fetchCepData} 
            disabled={loading || cep.replace(/\D/g, "").length !== 8}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Consultando...
              </>
            ) : (
              "Consultar"
            )}
          </Button>
        </div>
      </div>

      {locationData && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <h4 className="font-semibold">Localização Identificada</h4>
          </div>
          
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cidade:</span>
              <span className="font-medium">{locationData.city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado:</span>
              <span className="font-medium">{locationData.state} ({locationData.stateCode})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Fator Regional:</span>
              <Badge variant={locationData.factor > 1.05 ? "destructive" : "default"}>
                {locationData.factor.toFixed(4)}x ({(locationData.factor * 100 - 100).toFixed(1)}%)
              </Badge>
            </div>
          </div>
          
          <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 mt-2">
            <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Este fator será aplicado automaticamente no cálculo de preços para compensar diferenças de custo logístico e mercado regional
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
