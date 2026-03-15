import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import Button from "@/Components/common/Modern/Button";
import { Badge } from "@/Components/ui/badge";
import type { AddonPackage } from "@/types/addon";
import { Sparkles, HardDrive, Minus, Plus } from "lucide-react";

interface AddonPackageCardProps {
  package: AddonPackage;
  onPurchase: (sku: string, quantity: number) => void;
  loading?: boolean;
}

export const AddonPackageCard: React.FC<AddonPackageCardProps> = ({
  package: pkg,
  onPurchase,
  loading = false,
}) => {
  const [quantity, setQuantity] = useState(1);

  const isAI = pkg.sku.startsWith("ai_");
  const Icon = isAI ? Sparkles : HardDrive;
  const unit = isAI ? "créditos" : "GB";

  const totalPrice = pkg.price * quantity;
  const totalAmount = pkg.amount * quantity;

  const handlePurchase = () => {
    onPurchase(pkg.sku, quantity);
  };

  const incrementQuantity = () => {
    if (quantity < 100) setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  return (
    <Card
      className={`relative transition-all hover:shadow-lg ${pkg.popular ? "border-2 border-blue-500" : ""}`}
    >
      {pkg.popular && <Badge className="absolute -top-3 right-4 bg-blue-600">Más Popular</Badge>}

      <CardHeader>
        <div className="flex items-center justify-between">
          <Icon className="h-8 w-8 text-blue-600" />
          {pkg.savings_percentage > 0 && (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
            >
              Ahorra {pkg.savings_percentage}%
            </Badge>
          )}
        </div>
        <CardTitle className="mt-4">{pkg.name}</CardTitle>
        <CardDescription>{pkg.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Amount */}
        <div className="rounded-lg bg-gray-50 py-4 text-center dark:bg-gray-800">
          <div className="text-3xl font-bold text-blue-600">{totalAmount.toLocaleString()}</div>
          <div className="text-muted-foreground text-sm">{unit}</div>
        </div>

        {/* Price */}
        <div className="text-center">
          <div className="text-2xl font-bold">${totalPrice.toFixed(2)}</div>
          {quantity > 1 && (
            <div className="text-muted-foreground text-xs">
              ${pkg.price.toFixed(2)} × {quantity}
            </div>
          )}
        </div>

        {/* Quantity Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Cantidad:</label>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={decrementQuantity}
              disabled={quantity <= 1 || loading}
              className="h-8 w-8"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={incrementQuantity}
              disabled={quantity >= 100 || loading}
              className="h-8 w-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handlePurchase}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? "Procesando..." : "Comprar Ahora"}
        </Button>
      </CardFooter>
    </Card>
  );
};
