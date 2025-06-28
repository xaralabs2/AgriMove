import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/auth/authContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import AppHeader from "@/components/AppHeader";

interface Produce {
  id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  unit: string;
  farmerId: number;
}

interface Forecast {
  id: number;
  produceId: number;
  farmerId: number;
  forecastDate: string;
  estimatedDemand: number;
  confidenceScore: number;
  factors: any;
  model: string;
  createdAt: string;
}

interface ForecastResponse {
  forecasts: Forecast[];
  factorsConsidered: string[];
  summary: string;
}

const ForecastPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProduceId, setSelectedProduceId] = useState<string>("");
  const [forecastParams, setForecastParams] = useState({
    startDate: "",
    endDate: "",
    interval: "7", // Default to weekly forecasts
  });

  // Get all produce items for the farmer
  const {
    data: produceItems,
    isLoading: isLoadingProduce,
    error: produceError,
  } = useQuery({
    queryKey: ["/api/produce"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/produce");
      const data = await res.json();
      // Filter for farmer's own produce
      return data.filter((item: Produce) => item.farmerId === user?.id);
    },
    enabled: !!user,
  });

  // Get latest forecasts
  const {
    data: latestForecasts,
    isLoading: isLoadingForecasts,
    error: forecastsError,
  } = useQuery({
    queryKey: ["/api/forecasts/latest"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/forecasts/latest");
      return res.json();
    },
    enabled: !!user,
  });

  // Generate forecast mutation
  const generateForecastMutation = useMutation({
    mutationFn: async (forecastData: any) => {
      const res = await apiRequest("POST", "/api/forecasts/generate", forecastData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/forecasts/latest"] });
      if (selectedProduceId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/forecasts/product", parseInt(selectedProduceId)] 
        });
      }
      toast({
        title: "Forecast generated",
        description: "Your demand forecast has been successfully generated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate forecast. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Get forecasts for a specific product when selected
  const {
    data: productForecasts,
    isLoading: isLoadingProductForecasts,
    error: productForecastsError,
  } = useQuery({
    queryKey: ["/api/forecasts/product", selectedProduceId ? parseInt(selectedProduceId) : null],
    queryFn: async () => {
      if (!selectedProduceId) return null;
      const res = await apiRequest("GET", `/api/forecasts/product/${selectedProduceId}`);
      return res.json();
    },
    enabled: !!selectedProduceId && !!user,
  });

  // Initialize dates
  useEffect(() => {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);
    
    setForecastParams({
      startDate: today.toISOString().split('T')[0],
      endDate: nextMonth.toISOString().split('T')[0],
      interval: "7",
    });
  }, []);

  const handleGenerateForecast = () => {
    if (!selectedProduceId) {
      toast({
        title: "Error",
        description: "Please select a product",
        variant: "destructive",
      });
      return;
    }

    if (!forecastParams.startDate || !forecastParams.endDate) {
      toast({
        title: "Error",
        description: "Please select start and end dates",
        variant: "destructive",
      });
      return;
    }

    generateForecastMutation.mutate({
      produceId: parseInt(selectedProduceId),
      forecastStartDate: forecastParams.startDate,
      forecastEndDate: forecastParams.endDate,
      daysInterval: parseInt(forecastParams.interval),
    });
  };

  // Helper to get product name by ID
  const getProductName = (id: number) => {
    if (!produceItems) return "Unknown Product";
    const product = produceItems.find((p: Produce) => p.id === id);
    return product ? product.name : "Unknown Product";
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="pb-20">
      <AppHeader title="Demand Forecasting" showBackButton />

      <div className="container mx-auto px-4 py-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-6 w-6 mr-2" />
              Generate New Forecast
            </CardTitle>
            <CardDescription>
              Analyze historical sales data to predict future demand for your products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product">Select Product</Label>
                <Select
                  value={selectedProduceId}
                  onValueChange={setSelectedProduceId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingProduce ? (
                      <SelectItem value="loading" disabled>
                        Loading products...
                      </SelectItem>
                    ) : produceItems && produceItems.length > 0 ? (
                      produceItems.map((item: Produce) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name} ({item.unit})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No products available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="interval">Forecast Interval (Days)</Label>
                <Select
                  value={forecastParams.interval}
                  onValueChange={(value) =>
                    setForecastParams({ ...forecastParams, interval: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Daily</SelectItem>
                    <SelectItem value="7">Weekly</SelectItem>
                    <SelectItem value="14">Bi-weekly</SelectItem>
                    <SelectItem value="30">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={forecastParams.startDate}
                  onChange={(e) =>
                    setForecastParams({
                      ...forecastParams,
                      startDate: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={forecastParams.endDate}
                  onChange={(e) =>
                    setForecastParams({
                      ...forecastParams,
                      endDate: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleGenerateForecast}
              disabled={generateForecastMutation.isPending || !selectedProduceId}
            >
              {generateForecastMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Forecast"
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Display selected product forecasts */}
        {selectedProduceId && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                Forecasts for {getProductName(parseInt(selectedProduceId))}
              </CardTitle>
              <CardDescription>
                Detailed demand predictions for your selected product
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProductForecasts ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : productForecasts && productForecasts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Forecast Date</TableHead>
                      <TableHead>Estimated Demand</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productForecasts.map((forecast: Forecast) => (
                      <TableRow key={forecast.id}>
                        <TableCell>{formatDate(forecast.forecastDate)}</TableCell>
                        <TableCell>{forecast.estimatedDemand.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={forecast.confidenceScore} className="w-[80px]" />
                            <span>{Math.round(forecast.confidenceScore)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(forecast.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  No forecasts available for this product. Generate a new forecast to see predictions.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Latest forecasts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-6 w-6 mr-2" />
              Recent Forecasts
            </CardTitle>
            <CardDescription>
              Your latest demand forecasts across all products
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingForecasts ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : latestForecasts && latestForecasts.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {latestForecasts.reduce((acc: any, forecast: Forecast) => {
                  // Group forecasts by product
                  const key = forecast.produceId;
                  if (!acc[key]) {
                    acc[key] = {
                      productId: forecast.produceId,
                      productName: getProductName(forecast.produceId),
                      forecasts: []
                    };
                  }
                  acc[key].forecasts.push(forecast);
                  return acc;
                }, {}).map((group: any, idx: number) => (
                  <AccordionItem key={idx} value={`item-${idx}`}>
                    <AccordionTrigger>{group.productName}</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Forecast Date</TableHead>
                            <TableHead>Estimated Demand</TableHead>
                            <TableHead>Confidence</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.forecasts.map((forecast: Forecast) => (
                            <TableRow key={forecast.id}>
                              <TableCell>{formatDate(forecast.forecastDate)}</TableCell>
                              <TableCell>{forecast.estimatedDemand.toFixed(2)}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Progress value={forecast.confidenceScore} className="w-[80px]" />
                                  <span>{Math.round(forecast.confidenceScore)}%</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                No forecasts available. Generate a new forecast to see predictions.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForecastPage;