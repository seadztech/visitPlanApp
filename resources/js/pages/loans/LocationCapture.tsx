// resources/js/Pages/loans/LocationCapture.tsx
import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { PageProps } from '@inertiajs/core';
import { Link, useForm } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Navigation,
  LocateFixed,
  CheckCircle,
  XCircle,
  ChevronLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';
import MainLayout from '../Layouts/MainLayout';

interface LoanListing {
  id: number;
  account_title: string;
  client_id: string;
  latitude?: string;
  longitude?: string;
  address?: string;
}

interface Props extends PageProps {
  listing: LoanListing;
  GOOGLE_MAPS_API_KEY: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem'
};

const defaultCenter = {
  lat: -1.2921, // Default center (Kenya)
  lng: 36.8219
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
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [zoom, setZoom] = useState(12);

  const { isLoaded, loadError } = useJsApiLoader({
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
        address: listing.address || ''
      });
    }
  }, [listing]);

  const getAddressFromCoordinates = useCallback(async (lat: number, lng: number) => {
    if (!isLoaded) return;
    
    setIsLoadingAddress(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ 
        location: { lat, lng } 
      });
      
      if (response.results && response.results[0]) {
        setData('address', response.results[0].formatted_address);
      }
    } catch (error) {
      console.error('Error getting address:', error);
    } finally {
      setIsLoadingAddress(false);
    }
  }, [isLoaded]);

  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      const location = { lat, lng };
      
      setSelectedLocation(location);
      setData({
        latitude: lat.toString(),
        longitude: lng.toString()
      });
      
      getAddressFromCoordinates(lat, lng);
      
      if (map) {
        map.panTo(location);
        setZoom(16);
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
        setData({
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        });
        
        if (map) {
          map.panTo(location);
          setZoom(16);
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

  if (loadError) {
    return (
      <MainLayout title="Location Capture">
        <div className="p-6">
          <div className="text-center py-12">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load maps</h3>
            <p className="text-muted-foreground">
              Please check your internet connection and try again.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={`Capture Location - ${listing.account_title}`}>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href={route('loans.listing.show', listing.id)}>
              <ChevronLeft className="h-4 w-4" />
              Back to Details
            </Link>
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold">Capture Location</h1>
            <p className="text-sm text-muted-foreground">
              {listing.account_title} • ID: {listing.client_id}
            </p>
          </div>
          
          <div className="w-20"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Select Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isLoaded ? (
                <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p>Loading map...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative border rounded-lg overflow-hidden">
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={selectedLocation || defaultCenter}
                      zoom={zoom}
                      onLoad={onLoad}
                      onClick={handleMapClick}
                      options={{
                        streetViewControl: true,
                        mapTypeControl: true,
                        fullscreenControl: true,
                        zoomControl: true,
                        clickableIcons: false,
                        styles: [
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
                          animation={google.maps.Animation.DROP}
                        />
                      )}
                      
                      {currentLocation && (
                        <Marker
                          position={currentLocation}
                          icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: "#10b981",
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 3,
                          }}
                        />
                      )}
                    </GoogleMap>
                    
                    {/* Map Instructions Overlay */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                      <p className="text-sm font-medium">Click on the map to place a marker</p>
                      <p className="text-xs text-muted-foreground">Drag marker to adjust position</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      onClick={handleGetCurrentLocation}
                      disabled={isGeolocating || processing}
                      className="gap-2"
                      variant="outline"
                    >
                      {isGeolocating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LocateFixed className="h-4 w-4" />
                      )}
                      {isGeolocating ? 'Getting Location...' : 'Use Current Location'}
                    </Button>
                    
                    <Button
                      onClick={() => {
                        if (map) {
                          map.panTo(selectedLocation || defaultCenter);
                          setZoom(selectedLocation ? 16 : 12);
                        }
                      }}
                      variant="outline"
                      className="gap-2"
                    >
                      <Navigation className="h-4 w-4" />
                      Re-center
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Controls Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status */}
              <div className={`p-4 rounded-lg ${selectedLocation ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Status</span>
                  {selectedLocation ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Ready to Save
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      No Location Selected
                    </span>
                  )}
                </div>
                <p className="text-sm">
                  {selectedLocation 
                    ? 'Location selected. You can adjust by dragging the marker.'
                    : 'Click on the map or use "Current Location" to select a point.'}
                </p>
              </div>

              {/* Coordinates */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    value={data.latitude}
                    onChange={(e) => setData('latitude', e.target.value)}
                    placeholder="e.g., -1.292066"
                    readOnly={processing}
                  />
                  {errors.latitude && (
                    <p className="text-sm text-red-500">{errors.latitude}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    value={data.longitude}
                    onChange={(e) => setData('longitude', e.target.value)}
                    placeholder="e.g., 36.821945"
                    readOnly={processing}
                  />
                  {errors.longitude && (
                    <p className="text-sm text-red-500">{errors.longitude}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">
                    Address {isLoadingAddress && <span className="text-xs text-muted-foreground">(Fetching...)</span>}
                  </Label>
                  <textarea
                    id="address"
                    value={data.address}
                    onChange={(e) => setData('address', e.target.value)}
                    placeholder="Address will be auto-filled from coordinates"
                    className="w-full min-h-[100px] p-3 border rounded-md text-sm"
                    rows={4}
                    disabled={processing}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500">{errors.address}</p>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Instructions:</strong> Click on map or use current location. Drag marker to adjust. Address auto-fills from coordinates.
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  onClick={handleSaveLocation}
                  disabled={!selectedLocation || processing}
                  className="gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Save Location
                    </>
                  )}
                </Button>
                
                <Button
                  asChild
                  variant="outline"
                  disabled={processing}
                >
                  <Link href={route('loans.listing.show', listing.id)}>
                    Cancel
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}