// LocationCapture.tsx
import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { PageProps } from '@inertiajs/core';
import { Link, useForm } from '@inertiajs/react';
import MainLayout from '../Layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  MapPin, 
  Navigation,
  LocateFixed,
  CheckCircle,
  XCircle,
  ChevronLeft,
  Loader2,
  Info,
  Target,
  RefreshCw,
  Globe,
  AlertCircle,
  Save,
  ArrowLeft
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface LoanListing {
  id: number;
  account_title: string;
  client_id: string;
  latitude?: string;
  longitude?: string;
}

interface Props extends PageProps {
  listing: LoanListing;
  GOOGLE_MAPS_API_KEY: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '0.75rem'
};

const defaultCenter = {
  lat: -0.5412456083029794, 
  lng: 37.45302691011735
};

export default function LocationCapture({ listing, GOOGLE_MAPS_API_KEY }: Props) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [zoom, setZoom] = useState(14);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const { data, setData, post, processing, errors } = useForm({
    latitude: '',
    longitude: '',
    address: ''
  });

  // Initialize with existing location if available
  useEffect(() => {
    if (listing.latitude && listing.longitude) {
      const lat = parseFloat(listing.latitude);
      const lng = parseFloat(listing.longitude);
      const location = { lat, lng };
      setSelectedLocation(location);
      setData({
        latitude: listing.latitude,
        longitude: listing.longitude,
        address: ''
      });
      
      if (isLoaded) {
        getAddressFromCoordinates(lat, lng);
      }
    }
  }, [listing, isLoaded]);

  const getAddressFromCoordinates = useCallback(async (lat: number, lng: number) => {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results[0]) {
        setAddress(response.results[0].formatted_address);
        setData('address', response.results[0].formatted_address);
      }
    } catch (error) {
      console.error('Error getting address:', error);
    }
  }, []);

  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      const location = { lat, lng };
      
      setSelectedLocation(location);
      setData({
        latitude: lat.toString(),
        longitude: lng.toString(),
        address: ''
      });
      
      getAddressFromCoordinates(lat, lng);
      
      if (map) {
        map.panTo(location);
        setZoom(18);
      }
    }
  }, [map, getAddressFromCoordinates]);

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsGeolocating(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setCurrentLocation(location);
        setSelectedLocation(location);
        setAccuracy(position.coords.accuracy);
        setData({
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
          address: ''
        });
        
        if (map) {
          map.panTo(location);
          setZoom(18);
        }
        
        getAddressFromCoordinates(location.lat, location.lng);
        setIsGeolocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location. Please make sure location services are enabled.');
        setIsGeolocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [map, getAddressFromCoordinates]);

  const handleSaveLocation = useCallback(() => {
    if (!selectedLocation) {
      alert('Please select a location first');
      return;
    }

    post(route('loans.listing.update', listing.id));
  }, [selectedLocation, listing.id]);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    
    if (listing.latitude && listing.longitude) {
      const lat = parseFloat(listing.latitude);
      const lng = parseFloat(listing.longitude);
      mapInstance.panTo({ lat, lng });
      setZoom(16);
    }
  }, [listing]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (loadError) {
    return (
      <MainLayout title="Location Capture">
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mx-auto">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold">Map Loading Failed</h3>
                <p className="text-muted-foreground">
                  Please check your internet connection and try again.
                </p>
                <Button asChild className="w-full">
                  <Link href={route('loans.listing.show', listing.id)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Return to Details
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={`Location - ${listing.account_title}`}>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                asChild 
                variant="ghost" 
                size="sm" 
                className="gap-2 hover:bg-gray-100"
              >
                <Link href={route('loans.listing.show', listing.id)}>
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
              <div className="hidden sm:block h-6 w-px bg-gray-200" />
              <div className='w-full items-center justify-end'>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Capture Location</h1>
                <p className="text-sm text-gray-600">
                  Client: <span className="font-medium">{listing.account_title}</span> • 
                  ID: <span className="font-mono font-medium">{listing.client_id}</span>
                </p>
              </div>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
              <div className='justi'>
                  <Button variant="default" size="sm" className="gap-2 right-0">
                  <Info className="h-4 w-4" />
                  Instructions
                </Button>
              </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    How to Capture Location
                  </DialogTitle>
                  <DialogDescription>
                    Follow these steps to accurately record the client's location
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">1</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Click on the Map</p>
                        <p className="text-sm text-gray-600">Click anywhere on the map to place a marker</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">2</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Use Current Location</p>
                        <p className="text-sm text-gray-600">Click the "Use GPS" button for accurate positioning</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">3</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Adjust Position</p>
                        <p className="text-sm text-gray-600">Drag the marker to fine-tune the exact location</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">4</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Save Location</p>
                        <p className="text-sm text-gray-600">Click "Save Location" to store the coordinates</p>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Section */}
            <Card className="lg:col-span-2 border-0 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                  <p className='text-sm md:text-xl'>  Interactive Map</p>
                  </CardTitle>
                  {selectedLocation && (
                    <Badge variant="secondary" className="gap-1.5">
                      <Target className="h-3 w-3" />
                      Location Selected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!isLoaded ? (
                  <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <MapPin className="h-6 w-6 text-primary absolute inset-0 m-auto" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium">Loading Map...</p>
                      <p className="text-sm text-gray-600">Please wait while we load the map interface</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 shadow-inner">
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={selectedLocation || defaultCenter}
                        zoom={zoom}
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                        onClick={handleMapClick}
                        options={{
                          streetViewControl: true,
                          mapTypeControl: true,
                          fullscreenControl: true,
                          zoomControl: true,
                          mapTypeId: google.maps.MapTypeId.ROADMAP,
                          styles: [
                            {
                              featureType: "poi.business",
                              stylers: [{ visibility: "off" }]
                            },
                            {
                              featureType: "poi",
                              elementType: "labels",
                              stylers: [{ visibility: "off" }]
                            }
                          ]
                        }}
                      >
                        {selectedLocation && (
                          <Marker
                            position={selectedLocation}
                            draggable={true}
                            onDragEnd={(event) => {
                              if (event.latLng) {
                                const lat = event.latLng.lat();
                                const lng = event.latLng.lng();
                                setSelectedLocation({ lat, lng });
                                setData({
                                  latitude: lat.toString(),
                                  longitude: lng.toString()
                                });
                                getAddressFromCoordinates(lat, lng);
                              }
                            }}
                            icon={{
                              url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z'/%3E%3C/svg%3E",
                              scaledSize: new google.maps.Size(40, 40),
                              anchor: new google.maps.Point(20, 40)
                            }}
                          />
                        )}
                        
                        {currentLocation && (
                          <Marker
                            position={currentLocation}
                            icon={{
                              url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2310b981'%3E%3Cpath d='M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z'/%3E%3C/svg%3E",
                              scaledSize: new google.maps.Size(32, 32),
                              anchor: new google.maps.Point(16, 16)
                            }}
                          />
                        )}
                      </GoogleMap>
                      
                      {/* Map Controls Overlay */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-3">
                          <p className="text-sm font-medium text-gray-800">Click on map to place marker</p>
                          <p className="text-xs text-gray-600">Drag marker to adjust position</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Map Control Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Button
                        onClick={handleGetCurrentLocation}
                        disabled={isGeolocating || processing}
                        className="gap-2 h-12"
                        variant="default"
                        size="lg"
                      >
                        {isGeolocating ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Detecting...
                          </>
                        ) : (
                          <>
                            <div className="p-1.5 rounded-md bg-primary/20">
                              <LocateFixed className="h-4 w-4" />
                            </div>
                            Use GPS Location
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => {
                          if (map) {
                            map.panTo(selectedLocation || defaultCenter);
                            setZoom(selectedLocation ? 18 : 14);
                          }
                        }}
                        variant="outline"
                        className="gap-2 h-12"
                        size="lg"
                      >
                        <div className="p-1.5 rounded-md bg-gray-100">
                          <Navigation className="h-4 w-4" />
                        </div>
                        Re-center View
                      </Button>
                      
                      <Button
                        onClick={() => {
                          if (map) {
                            map.panTo(defaultCenter);
                            setZoom(14);
                          }
                        }}
                        variant="outline"
                        className="gap-2 h-12"
                        size="lg"
                      >
                        <div className="p-1.5 rounded-md bg-gray-100">
                          <RefreshCw className="h-4 w-4" />
                        </div>
                        Reset Map
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Controls Section */}
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    Location Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Location Status */}
                  <div className={`p-4 rounded-xl ${selectedLocation ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Status</span>
                      {selectedLocation ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 gap-1.5">
                          <CheckCircle className="h-3 w-3" />
                          Ready to Save
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1.5">
                          <AlertCircle className="h-3 w-3" />
                          Awaiting Selection
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">
                      {selectedLocation 
                        ? '✓ Location coordinates have been selected'
                        : 'Click on the map or use GPS to select a location'}
                    </p>
                  </div>

                  {/* Accuracy Indicator */}
                  {accuracy && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">GPS Accuracy</Label>
                        <span className="text-sm font-mono">
                          ±{(accuracy).toFixed(1)}m
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, 100 - (accuracy / 100))} 
                        className="h-2"
                      />
                      <p className="text-xs text-gray-600">
                        Higher accuracy provides better location precision
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Coordinates Display */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="latitude" className="text-sm font-medium mb-2 block">
                        Latitude
                      </Label>
                      <div className="relative">
                        <Input
                          id="latitude"
                          value={data.latitude}
                          onChange={(e) => setData('latitude', e.target.value)}
                          placeholder="Waiting for selection..."
                          readOnly
                          className="font-mono text-sm h-10 bg-gray-50"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                          °N
                        </div>
                      </div>
                      {errors.latitude && (
                        <p className="text-sm text-red-500 mt-1">{errors.latitude}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="longitude" className="text-sm font-medium mb-2 block">
                        Longitude
                      </Label>
                      <div className="relative">
                        <Input
                          id="longitude"
                          value={data.longitude}
                          onChange={(e) => setData('longitude', e.target.value)}
                          placeholder="Waiting for selection..."
                          readOnly
                          className="font-mono text-sm h-10 bg-gray-50"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                          °E
                        </div>
                      </div>
                      {errors.longitude && (
                        <p className="text-sm text-red-500 mt-1">{errors.longitude}</p>
                      )}
                    </div>

                    {address && (
                      <>
                        <Separator />
                        <div>
                          <Label className="text-sm font-medium mb-2 block">
                            Address
                          </Label>
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-700">{address}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <Separator />

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      onClick={handleSaveLocation}
                      disabled={!selectedLocation || processing}
                      className="gap-2 h-12 w-full"
                      size="lg"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Saving Location...
                        </>
                      ) : (
                        <>
                          <div className="p-1 rounded bg-white/20">
                            <Save className="h-4 w-4" />
                          </div>
                          Save Location
                        </>
                      )}
                    </Button>
                    
                    <Button
                      asChild
                      variant="outline"
                      disabled={processing}
                      className="gap-2 h-11 w-full"
                    >
                      <Link href={route('loans.listing.show', listing.id)}>
                        <ArrowLeft className="h-4 w-4" />
                        Cancel & Return
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Info className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Tips for Accurate Location</h3>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Use GPS in open areas for better accuracy</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Zoom in for precise marker placement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Verify the address matches the actual location</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}