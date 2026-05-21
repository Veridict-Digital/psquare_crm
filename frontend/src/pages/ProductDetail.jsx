import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag,
  Tag,
  Package,
  DollarSign,
  BarChart3,
  Grid3X3,
  Hash,
  Percent,
  Image as ImageIcon,
  Edit,
  ArrowLeft,
  Layers,
  Info,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  ChevronRight,
  ZoomIn,
  Truck,
  Shield,
} from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const response = await axios.get(`api/products/${id}/`);
      return response.data;
    },
  });

  const { data: brandCategories } = useQuery({
    queryKey: ["brandCategories"],
    queryFn: async () => {
      const response = await axios.get("/api/brand-categories/");
      return response.data;
    },
  });

  const { data: brandCategories1 } = useQuery({
    queryKey: ["brandCategories1"],
    queryFn: async () => {
      const response = await axios.get("/api/brand-categories-1/");
      return response.data;
    },
  });

  const { data: flavours } = useQuery({
    queryKey: ["flavours"],
    queryFn: async () => {
      const response = await axios.get("/api/flavours/");
      return response.data;
    },
  });

  const { data: residuals } = useQuery({
    queryKey: ["residuals"],
    queryFn: async () => {
      const response = await axios.get("/api/residuals/");
      return response.data;
    },
  });

  const { data: units } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const response = await axios.get("/api/units/");
      return response.data;
    },
  });

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount))
      return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Get all product images
  const getProductImages = () => {
    const images = [];
    ["image1", "image2", "image3", "image4"].forEach((imgKey) => {
      if (product?.[imgKey]) {
        images.push(product[imgKey]);
      }
    });
    return images;
  };

  // Get full image URL - using relative paths (Option 1)
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // If it's already a full URL, return as is
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    // Remove any leading slash if present
    const cleanPath = imagePath.startsWith("/")
      ? imagePath.substring(1)
      : imagePath;

    // Return relative path - browser will resolve to current domain
    return `/media/${cleanPath}`;
  };

  const productImages = getProductImages();
  const getLookupName = (items, value) =>
    items?.find((item) => item.id === parseInt(value))?.name || value;
  const productUnitName =
    getLookupName(units, product?.unit_display || product?.unit) || "";

  if (isLoading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading product details...
          </p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">
            Error Loading Product
          </h2>
          <p className="text-gray-600 text-center mb-6">{error.message}</p>
          <Link
            to="/products"
            className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition duration-200 text-center"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-gray-600 hover:text-blue-600 transition duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
            <Link
              to={`/products/edit/${product?.id}`}
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-200 shadow-md"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Product
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
            {/* Product Gallery Section */}
            <div>
              {/* Main Image */}
              <div className="bg-gray-50 rounded-lg overflow-hidden mb-4 max-w-md mx-auto">
                <div className="aspect-square relative group">
                  {productImages[selectedImage] ? (
                    <>
                      <img
                        src={getImageUrl(productImages[selectedImage])}
                        alt={product?.title}
                        className="w-full h-full object-contain cursor-zoom-in"
                        onClick={() => setIsZoomed(true)}
                        onError={(e) => {
                          console.error(
                            "Failed to load image:",
                            getImageUrl(productImages[selectedImage]),
                          );
                          e.target.onerror = null;
                          e.target.src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
                        }}
                      />
                      <button
                        className="absolute bottom-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition"
                        onClick={() => setIsZoomed(true)}
                      >
                        <ZoomIn className="h-5 w-5 text-gray-600" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Thumbnails */}
              {productImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {productImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === idx
                          ? "border-blue-500 shadow-md"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <img
                        src={getImageUrl(img)}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"%3E%3C/rect%3E%3C/svg%3E';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Video Link */}
              {product?.video_link && (
                <a
                  href={product.video_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  <div className="bg-red-500 text-white p-1 rounded-full">
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  Watch Video
                </a>
              )}

              {/*Description Section */}
              {product?.use_case && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Info className="h-5 w-4 text-blue-500" />
                    Description
                  </h3>
                  <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">
                    {product.use_case}
                  </p>
                </div>
              )}
            </div>

            {/* Product Information Section */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                {product?.title}
              </h1>

              {/* Price Section */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatCurrency(product?.price)}
                  </span>
                  {product?.mrp > product?.price && (
                    <>
                      <span className="text-lg text-gray-500 line-through">
                        {formatCurrency(product?.mrp)}
                      </span>
                      <span className="text-sm text-green-600 font-semibold">
                        Save {formatCurrency(product?.mrp - product?.price)}
                      </span>
                    </>
                  )}
                </div>
                <div className="text-sm text-green-600 font-medium">
                  ✓ Inclusive of all taxes
                </div>
              </div>

              {/* Product Details Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6 items-stretch">
                <div className="border border-gray-200 rounded-lg overflow-hidden h-full">
                  <table className="w-full text-sm h-full">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                          Product ID
                        </td>
                        <td className="px-4 py-3">
                          {product?.pid || product?.id}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                          SKU
                        </td>
                        <td className="px-4 py-3">{product?.sku}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                          HSN Code
                        </td>
                        <td className="px-4 py-3">{product?.hsn || "-"}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                          Category
                        </td>
                        <td className="px-4 py-3">
                          {product?.category_display ||
                            product?.category ||
                            "Uncategorized"}
                        </td>
                      </tr>
                      {product?.category1_display && (
                        <tr className="border-b border-gray-200">
                          <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                            Category 1
                          </td>
                          <td className="px-4 py-3">
                            {product?.category1_display}
                          </td>
                        </tr>
                      )}
                      {product?.category2_display && (
                        <tr className="border-b border-gray-200">
                          <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                            Category 2
                          </td>
                          <td className="px-4 py-3">
                            {product?.category2_display}
                          </td>
                        </tr>
                      )}
                      {product?.category3_display && (
                        <tr className="border-b border-gray-200">
                          <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                            Category 3
                          </td>
                          <td className="px-4 py-3">
                            {product?.category3_display}
                          </td>
                        </tr>
                      )}
                      {product?.category4_display && (
                        <tr className="border-b border-gray-200">
                          <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                            Category 4
                          </td>
                          <td className="px-4 py-3">
                            {product?.category4_display}
                          </td>
                        </tr>
                      )}
                      <tr className="border-b border-gray-200">
                        <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                          Stock Quantity
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-semibold ${product?.stock_qty > 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {product?.stock_qty}{" "}
                            {product?.stock_qty > 0
                              ? "units available"
                              : "units"}
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                          MRP
                        </td>
                        <td className="px-4 py-3">
                          {formatCurrency(product?.mrp)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden h-full">
                  <table className="w-full text-sm h-full">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                          Selling Price
                        </td>
                        <td className="px-4 py-3">
                          {formatCurrency(product?.price)}
                        </td>
                      </tr>
                      {product?.b2c_price > 0 && (
                        <tr className="border-b border-gray-200">
                          <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                            B2C Price
                          </td>
                          <td className="px-4 py-3">
                            {formatCurrency(product?.b2c_price)}
                          </td>
                        </tr>
                      )}
                      {product?.b2b_price > 0 && (
                        <tr className="border-b border-gray-200">
                          <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                            B2B Price
                          </td>
                          <td className="px-4 py-3">
                            {formatCurrency(product?.b2b_price)}
                          </td>
                        </tr>
                      )}
                      {product?.purchase_price > 0 && (
                        <tr className="border-b border-gray-200">
                          <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                            Purchase Price
                          </td>
                          <td className="px-4 py-3">
                            {formatCurrency(product?.purchase_price)}
                          </td>
                        </tr>
                      )}
                      {product?.brand_name && (
                        <tr className="border-b border-gray-200">
                          <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                            Brand Name
                          </td>
                          <td className="px-4 py-3">{product?.brand_name}</td>
                        </tr>
                      )}
                      {product?.brand_category && (
                        <tr className="border-b border-gray-200">
                          <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                            Brand Category
                          </td>
                          <td className="px-4 py-3">
                            {getLookupName(
                              brandCategories,
                              product?.brand_category,
                            )}
                          </td>
                        </tr>
                      )}
                      {product?.brand_category1 && (
                        <tr className="border-b border-gray-200">
                          <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                            Brand Category 1
                          </td>
                          <td className="px-4 py-3">
                            {getLookupName(
                              brandCategories1,
                              product?.brand_category1,
                            )}
                          </td>
                        </tr>
                      )}
                      {product?.flavour && (
                        <tr className="border-b border-gray-200">
                          <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                            Flavour
                          </td>
                          <td className="px-4 py-3">
                            {getLookupName(flavours, product?.flavour)}
                          </td>
                        </tr>
                      )}
                      {product?.residual && (
                        <tr className="border-b border-gray-200">
                          <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                            Residual
                          </td>
                          <td className="px-4 py-3">
                            {getLookupName(residuals, product?.residual)}
                          </td>
                        </tr>
                      )}
                      {product?.gst_rate_display && (
                        <tr className="border-b border-gray-200">
                          <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                            GST Rate
                          </td>
                          <td className="px-4 py-3">
                            {product?.gst_rate_display}%
                          </td>
                        </tr>
                      )}
                      {product?.product_weight > 0 && (
                        <tr className="border-b border-gray-200">
                          <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                            Product Weight
                          </td>
                          <td className="px-4 py-3">
                            {product?.product_weight}{" "}
                            {productUnitName}
                          </td>
                        </tr>
                      )}
                      {product?.packing_weight > 0 && (
                        <tr className="border-b border-gray-200">
                          <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                            Packing Weight
                          </td>
                          <td className="px-4 py-3">
                            {product?.packing_weight}{" "}
                            {product?.packing_weight_unit_display || ""}
                          </td>
                        </tr>
                      )}
                      {(product?.length_cm ||
                        product?.breadth_cm ||
                        product?.height_cm) && (
                        <tr className="border-b border-gray-200">
                          <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                            Dimensions (L×B×H)
                          </td>
                          <td className="px-4 py-3">
                            {product?.length_cm || "-"} ×{" "}
                            {product?.breadth_cm || "-"} ×{" "}
                            {product?.height_cm || "-"} cm
                          </td>
                        </tr>
                      )}
                      {product?.product_volume > 0 && (
                        <tr className="border-b border-gray-200">
                          <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                            Product Volume
                          </td>
                          <td className="px-4 py-3">
                            {product?.product_volume}
                          </td>
                        </tr>
                      )}
                      {product?.video_link && (
                        <tr className="border-b border-gray-200">
                          <td className="font-semibold px-4 py-3 bg-[#1a2332] text-white w-1/3">
                            Video Link
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={product.video_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {product.video_link.substring(0, 50)}...
                            </a>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Product Highlights / Pointers */}
              {(product?.pointer1 ||
                product?.pointer2 ||
                product?.pointer3 ||
                product?.pointer4 ||
                product?.pointer5) && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    Product Highlights
                  </h3>
                  <ul className="space-y-2">
                    {[1, 2, 3, 4, 5].map((num) => {
                      const pointer = product?.[`pointer${num}`];
                      if (!pointer) return null;
                      return (
                        <li
                          key={num}
                          className="flex items-start gap-2 text-sm text-gray-700"
                        >
                          <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-600">
                            {num}
                          </span>
                          {pointer}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      {isZoomed && productImages[selectedImage] && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={getImageUrl(productImages[selectedImage])}
              alt={product?.title}
              className="max-w-full max-h-screen object-contain"
            />
            <button
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition text-xl"
              onClick={() => setIsZoomed(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;