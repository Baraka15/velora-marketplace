import React, { useState } from 'react';
import { YStack, XStack, SizableText, Input, Button, ScrollView, SafeArea, AppHeader, toast, Switch, Label, View, Image } from '@blinkdotnew/mobile-ui';
import { Camera, FileText, Check, ChevronDown, Plus, X, AlertCircle } from '@blinkdotnew/mobile-ui';
import { blink } from '@/lib/blink';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@/hooks/useAuth';
import { Platform } from 'react-native';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function CreateProduct() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    type: 'physical' as 'physical' | 'digital' | 'membership' | 'course',
    category: '',
    stockQuantity: '100',
    isB2b: false,
    minOrderQuantity: '1',
    affiliateEnabled: false,
    affiliateCommissionRate: '10',
    published: true,
  });

  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [digitalFile, setDigitalFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const validateImageSize = async (uri: string): Promise<{ valid: boolean; size?: number }> => {
    try {
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        return { valid: blob.size <= MAX_IMAGE_SIZE, size: blob.size };
      } else {
        // On native, estimate from URI or use FileSystem
        const response = await fetch(uri);
        const blob = await response.blob();
        return { valid: blob.size <= MAX_IMAGE_SIZE, size: blob.size };
      }
    } catch {
      return { valid: true }; // Allow if we can't check
    }
  };

  const pickImage = async () => {
    setThumbnailError(null);
    
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        toast('Permission Required', { message: 'Please allow access to your photo library.', variant: 'error' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        
        // Validate size
        const { valid, size } = await validateImageSize(asset.uri);
        if (!valid) {
          const sizeMB = size ? (size / (1024 * 1024)).toFixed(1) : 'unknown';
          setThumbnailError(`Image too large (${sizeMB}MB). Max size is 5MB.`);
          toast('File Too Large', { message: 'Please choose an image under 5MB.', variant: 'error' });
          return;
        }

        setThumbnail(asset.uri);
      }
    } catch (error: any) {
      toast('Error', { message: 'Failed to pick image. Please try again.', variant: 'error' });
    }
  };

  const pickFile = async () => {
    setFileError(null);
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        
        // Validate file size
        if (file.size && file.size > MAX_FILE_SIZE) {
          const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
          setFileError(`File too large (${sizeMB}MB). Max size is 50MB.`);
          toast('File Too Large', { message: 'Please choose a file under 50MB.', variant: 'error' });
          return;
        }

        setDigitalFile(file);
      }
    } catch (error: any) {
      toast('Error', { message: 'Failed to pick file. Please try again.', variant: 'error' });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      toast('Required Fields', { message: 'Please enter product name and price.', variant: 'error' });
      return;
    }

    setLoading(true);
    setUploadProgress(10);

    try {
      let imageUrl = '';
      let fileUrl = '';

      // 1. Upload Thumbnail
      if (thumbnail) {
        const response = await fetch(thumbnail);
        const blob = await response.blob();
        const extension = thumbnail.split('.').pop() || 'jpg';
        const { publicUrl } = await blink.storage.upload(
          blob,
          `products/${Date.now()}_thumb.${extension}`
        );
        imageUrl = publicUrl;
        setUploadProgress(40);
      }

      // 2. Upload Digital File
      if (formData.type === 'digital' && digitalFile) {
        const response = await fetch(digitalFile.uri);
        const blob = await response.blob();
        const { publicUrl } = await blink.storage.upload(
          blob,
          `digital-goods/${Date.now()}_${digitalFile.name}`,
          { onProgress: (p) => setUploadProgress(40 + (p * 0.5)) }
        );
        fileUrl = publicUrl;
      }

      setUploadProgress(90);

      // 3. Create Product in DB
      const slug = formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Math.random().toString(36).slice(2, 7);
      
      await blink.db.products.create({
        userId: user?.id,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        type: formData.type,
        category: formData.category,
        imageUrl,
        digitalFileUrl: fileUrl,
        stockQuantity: parseInt(formData.stockQuantity),
        isB2b: formData.isB2b,
        minOrderQuantity: parseInt(formData.minOrderQuantity),
        affiliateEnabled: formData.affiliateEnabled,
        affiliateCommissionRate: parseFloat(formData.affiliateCommissionRate),
        status: formData.published ? 'published' : 'draft',
        slug,
      });

      toast('Success', { message: 'Product created successfully!', variant: 'success' });
      router.back();
    } catch (error: any) {
      toast('Error', { message: error.message, variant: 'error' });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <SafeArea bg="$background">
      <AppHeader title="Create Product" onBack={() => router.back()} variant="back" />
      <ScrollView p="$4">
        <YStack gap="$5" pb="$10">
          <YStack gap="$2">
            <Label fontWeight="700">Product Thumbnail</Label>
            <Button
              height={150}
              br="$4"
              bw={1}
              bc={thumbnailError ? '$error' : '$border'}
              bs="dashed"
              bg="$backgroundSecondary"
              onPress={pickImage}
              jc="center"
              ai="center"
            >
              {thumbnail ? (
                <Image source={{ uri: thumbnail }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
              ) : (
                <YStack ai="center" gap="$2">
                  <Camera size={32} color={thumbnailError ? '$error' : '$color9'} />
                  <SizableText color={thumbnailError ? '$error' : '$color9'}>
                    {thumbnailError || 'Tap to upload image (max 5MB)'}
                  </SizableText>
                </YStack>
              )}
            </Button>
            {thumbnail && (
              <Button
                size="$2"
                variant="outline"
                alignSelf="flex-start"
                icon={<X size={14} />}
                onPress={() => { setThumbnail(null); setThumbnailError(null); }}
              >
                Remove Image
              </Button>
            )}
          </YStack>

          <Input
            label="Product Name"
            placeholder="e.g. Premium Cotton Hoodie"
            value={formData.name}
            onChangeText={(t) => setFormData({ ...formData, name: t })}
          />

          <Input
            label="Description"
            placeholder="Tell your customers about this product..."
            multiline
            height={100}
            value={formData.description}
            onChangeText={(t) => setFormData({ ...formData, description: t })}
          />

          <XStack gap="$3">
            <YStack f={1}>
              <Input
                label="Price (UGX)"
                placeholder="0.00"
                keyboardType="numeric"
                value={formData.price}
                onChangeText={(t) => setFormData({ ...formData, price: t })}
              />
            </YStack>
            <YStack f={1}>
              <Input
                label="Stock Quantity"
                placeholder="100"
                keyboardType="numeric"
                value={formData.stockQuantity}
                onChangeText={(t) => setFormData({ ...formData, stockQuantity: t })}
              />
            </YStack>
          </XStack>

          <YStack gap="$2">
            <Label fontWeight="700">Product Type</Label>
            <XStack gap="$2" fw="wrap">
              {['physical', 'digital', 'membership', 'course'].map((t) => (
                <Button
                  key={t}
                  size="$3"
                  variant={formData.type === t ? 'primary' : 'outline'}
                  onPress={() => setFormData({ ...formData, type: t as any })}
                  textTransform="capitalize"
                >
                  {t}
                </Button>
              ))}
            </XStack>
          </YStack>

          {formData.type === 'digital' && (
            <YStack gap="$2">
              <Label fontWeight="700">Digital File</Label>
              <Button
                variant="outline"
                bc={fileError ? '$error' : '$border'}
                icon={digitalFile ? <Check color="$success" size={18} /> : <FileText size={18} />}
                onPress={pickFile}
              >
                {digitalFile ? digitalFile.name : 'Upload File (Ebook, PDF, ZIP - max 50MB)'}
              </Button>
              {fileError && (
                <XStack ai="center" gap="$1">
                  <AlertCircle size={14} color="$error" />
                  <SizableText size="$2" color="$error">{fileError}</SizableText>
                </XStack>
              )}
              {digitalFile && (
                <Button
                  size="$2"
                  variant="outline"
                  alignSelf="flex-start"
                  icon={<X size={14} />}
                  onPress={() => { setDigitalFile(null); setFileError(null); }}
                >
                  Remove File
                </Button>
              )}
            </YStack>
          )}

          <XStack ai="center" jc="space-between" p="$3" br="$4" bg="$backgroundSecondary">
            <YStack gap="$1">
              <SizableText fontWeight="700">Enable Affiliates</SizableText>
              <SizableText size="$2" color="$color9">Allow others to sell this for a commission.</SizableText>
            </YStack>
            <Switch
              value={formData.affiliateEnabled}
              onValueChange={(v) => setFormData({ ...formData, affiliateEnabled: v })}
            />
          </XStack>

          {formData.affiliateEnabled && (
            <Input
              label="Affiliate Commission (%)"
              placeholder="10"
              keyboardType="numeric"
              value={formData.affiliateCommissionRate}
              onChangeText={(t) => setFormData({ ...formData, affiliateCommissionRate: t })}
            />
          )}

          <XStack ai="center" jc="space-between" p="$3" br="$4" bg="$backgroundSecondary">
            <YStack gap="$1">
              <SizableText fontWeight="700">Published</SizableText>
              <SizableText size="$2" color="$color9">Make this product visible to everyone.</SizableText>
            </YStack>
            <Switch
              value={formData.published}
              onValueChange={(v) => setFormData({ ...formData, published: v })}
            />
          </XStack>

          <Button
            bg="$color10"
            color="white"
            size="$5"
            fontWeight="700"
            onPress={handleSubmit}
            loading={loading}
          >
            {loading ? `Uploading ${Math.round(uploadProgress)}%` : 'Create Product'}
          </Button>
        </YStack>
      </ScrollView>
    </SafeArea>
  );
}
