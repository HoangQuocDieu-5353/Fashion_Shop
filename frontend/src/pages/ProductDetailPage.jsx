import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ShoppingBag, Star, Heart, Share2, Ruler, MessageSquare, Send, CornerDownRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchCartCount } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const BASE_URL = "http://localhost:5000";

  // State Sản phẩm & Giỏ hàng
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeImage, setActiveImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('detail');

  // 🚀 STATE CHO REVIEWS
  const [reviews, setReviews] = useState([]);
  const [reviewContent, setReviewContent] = useState('');
  const [rating, setRating] = useState(5);
  const [replyingTo, setReplyingTo] = useState(null); // Lưu ID của review đang được reply
  const [replyContent, setReplyContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const isFavorite = isInWishlist(id);

  const getImgUrl = (path) => {
    if (!path) return 'https://placehold.co/400x500?text=No+Image';
    if (path.startsWith('data:') || path.startsWith('blob:')) return path;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${BASE_URL}/${cleanPath}`;
  };

  useEffect(() => {
    fetchProductDetail();
    fetchReviews(); // Kéo bình luận về khi load trang
    window.scrollTo(0, 0);
  }, [id]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/products/${id}`);
      if (res.data.success) {
        const productData = res.data.data;
        setProduct(productData);
        if (productData.images && productData.images.length > 0) {
          setActiveImage(productData.images[0]);
        }
      }
    } catch (error) {
      toast.error("Không tìm thấy sản phẩm!");
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  // 🚀 FETCH BÌNH LUẬN
  const fetchReviews = async () => {
    try {
      const res = await axiosInstance.get(`/reviews/product/${id}`);
      if (res.data.success) {
        setReviews(res.data.data);
      }
    } catch (error) {
      console.error("Lỗi tải bình luận", error);
    }
  };

  // 🚀 GỬI BÌNH LUẬN GỐC
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewContent.trim()) return toast.error("Vui lòng nhập nội dung!");
    try {
      setSubmittingReview(true);
      const res = await axiosInstance.post('/reviews', {
        productId: id,
        rating,
        content: reviewContent
      });
      if (res.data.success) {
        toast.success("Đã gửi đánh giá!");
        setReviewContent('');
        setRating(5);
        fetchReviews(); // Tải lại danh sách
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Vui lòng đăng nhập để đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  // 🚀 GỬI TRẢ LỜI (REPLY)
  const handleSubmitReply = async (reviewId) => {
    if (!replyContent.trim()) return toast.error("Vui lòng nhập nội dung!");
    try {
      const res = await axiosInstance.post(`/reviews/${reviewId}/reply`, {
        content: replyContent
      });
      if (res.data.success) {
        toast.success("Đã trả lời!");
        setReplyingTo(null);
        setReplyContent('');
        fetchReviews(); // Tải lại danh sách
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi gửi trả lời");
    }
  };

  const availableColors = product ? [...new Set(product.variants.map(v => v.color))] : [];
  const availableSizesForColor = product && selectedColor 
    ? product.variants.filter(v => v.color === selectedColor).map(v => v.size)
    : [];
  const selectedVariant = product?.variants?.find(v => v.size === selectedSize && v.color === selectedColor);
  const displayPrice = selectedVariant?.price || product?.price || 0;

  const handleAddToCart = async () => {
    if (!selectedSize || !selectedColor) return toast.error("Vui lòng chọn Màu sắc và Kích cỡ!");
    if (selectedVariant && selectedVariant.stock <= 0) return toast.error("Sản phẩm đã hết hàng!");

    try {
      setAddingToCart(true);
      const res = await axiosInstance.post('/carts/add', {
        productId: id,
        quantity,
        size: selectedSize,
        color: selectedColor,
        variantId: selectedVariant?._id
      });
      if (res.data.success) {
        toast.success(`Đã thêm vào giỏ hàng!`);
        fetchCartCount(); 
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi thêm vào giỏ");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-[11px] font-bold tracking-[4px] text-zinc-300 uppercase animate-pulse">Đang tải dữ liệu...</div>;
  if (!product) return null;

  return (
    <div className="bg-white min-h-screen pb-20 pt-24">
      <div className="max-w-[1400px] mx-auto px-6">
        
        {/* BREADCRUMBS */}
        <nav className="flex items-center gap-2 text-[9px] font-bold text-zinc-400 uppercase tracking-[3px] mb-12">
          <Link to="/" className="hover:text-black transition">Trang chủ</Link>
          <span className="text-zinc-200">/</span>
          <Link to="/products" className="hover:text-black transition">{product.category?.name || 'Shop'}</Link>
          <span className="text-zinc-200">/</span>
          <span className="text-black">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* GALLERY ẢNH */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative overflow-hidden bg-zinc-50 aspect-[3/4] group border">
              <img src={getImgUrl(activeImage)} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt={product.name}/>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.images?.map((img, index) => (
                <div key={index} onClick={() => setActiveImage(img)} className={`cursor-pointer aspect-[3/4] overflow-hidden transition-all border ${activeImage === img ? 'ring-1 ring-black' : 'opacity-40 hover:opacity-100'}`}>
                  <img src={getImgUrl(img)} className="w-full h-full object-cover" alt={`gallery-${index}`} />
                </div>
              ))}
            </div>
          </div>

          {/* THÔNG TIN SẢN PHẨM */}
          <div className="lg:col-span-5 space-y-10 lg:sticky lg:top-32 h-fit">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[4px]">{product.category?.name || 'ESSENTIAL'}</p>
                <button className="text-zinc-300 hover:text-black transition"><Share2 size={16}/></button>
              </div>
              <h1 className="text-3xl font-bold text-black tracking-tighter leading-tight">{product.name}</h1>
              <div className="flex items-baseline gap-4 pt-2">
                <span className="text-2xl font-black text-black">{displayPrice.toLocaleString('vi-VN')} Đ</span>
                {selectedVariant?.price && selectedVariant.price !== product.price && (
                  <span className="text-sm text-zinc-300 line-through">{product.price.toLocaleString('vi-VN')} Đ</span>
                )}
              </div>
              {selectedVariant && (
                <div className={`text-[10px] font-bold uppercase tracking-widest ${selectedVariant.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {selectedVariant.stock > 0 ? `Còn lại: ${selectedVariant.stock} sản phẩm` : 'Hết hàng'}
                </div>
              )}
            </div>

            {/* CHỌN MÀU SẮC */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-black uppercase tracking-[3px]">Màu sắc: <span className="font-light text-zinc-400">{selectedColor || 'Chưa chọn'}</span></h3>
              <div className="flex flex-wrap gap-3">
                {availableColors.map(color => (
                  <button key={color} onClick={() => { setSelectedColor(color); setSelectedSize(''); }} className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest border transition-all ${selectedColor === color ? 'bg-black text-white border-black' : 'bg-white text-zinc-400 border-zinc-100 hover:border-black hover:text-black'}`}>
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* CHỌN KÍCH CỠ */}
            <div className={`space-y-4 transition-all ${!selectedColor ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-bold text-black uppercase tracking-[3px]">Kích cỡ: <span className="font-light text-zinc-400">{selectedSize || (selectedColor ? 'Vui lòng chọn' : '')}</span></h3>
                <button className="flex items-center gap-1 text-[9px] font-bold text-zinc-400 uppercase tracking-widest hover:text-black transition"><Ruler size={12}/> Bảng size</button>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {availableSizesForColor.map(size => {
                  const variant = product.variants.find(v => v.color === selectedColor && v.size === size);
                  const isOutOfStock = variant?.stock <= 0;
                  return (
                    <button key={size} disabled={isOutOfStock} onClick={() => setSelectedSize(size)} className={`h-12 text-[11px] font-bold border transition-all ${selectedSize === size ? 'bg-zinc-100 text-black border-black shadow-inner' : isOutOfStock ? 'bg-zinc-50 text-zinc-200 border-zinc-100 cursor-not-allowed line-through' : 'bg-white text-zinc-400 border-zinc-100 hover:border-black hover:text-black'}`}>
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* NÚT BẤM */}
            <div className="flex gap-3 pt-6">
              <button onClick={handleAddToCart} disabled={addingToCart || (selectedVariant && selectedVariant.stock <= 0)} className="flex-grow h-16 bg-black text-white font-bold text-[11px] uppercase tracking-[4px] hover:bg-zinc-800 transition-all flex items-center justify-center gap-4 disabled:bg-zinc-200">
                <ShoppingBag size={18} strokeWidth={1.5} />
                {addingToCart ? 'ĐANG XỬ LÝ...' : (selectedVariant?.stock <= 0 ? 'HẾT HÀNG' : 'THÊM VÀO GIỎ HÀNG')}
              </button>
              <button onClick={() => toggleWishlist(product)} className={`w-16 h-16 border flex items-center justify-center transition-all duration-500 ${isFavorite ? 'border-red-50 bg-red-50 text-red-500 shadow-sm' : 'border-zinc-100 text-zinc-400 hover:text-black hover:border-black'}`}>
                <Heart size={20} fill={isFavorite ? "currentColor" : "none"} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="mt-32">
          <div className="flex justify-center border-b border-zinc-100">
            {['detail', 'policy', 'reviews'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-12 py-8 text-[11px] font-bold uppercase tracking-[4px] transition-all relative ${activeTab === tab ? 'text-black' : 'text-zinc-300 hover:text-zinc-500'}`}>
                {tab === 'detail' ? 'Mô tả chi tiết' : tab === 'policy' ? 'Chính sách dịch vụ' : `Đánh giá (${reviews.length})`}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />}
              </button>
            ))}
          </div>

          <div className="py-20 max-w-3xl mx-auto">
            {activeTab === 'detail' && (
              <div className="text-[13px] leading-10 text-zinc-600 font-medium tracking-wide">
                {product.description?.split('\n').map((line, i) => (
                  <p key={i} className="flex gap-4 items-start mb-4"><span className="mt-4 w-1.5 h-[1px] bg-black shrink-0"></span>{line}</p>
                ))}
              </div>
            )}
            
            {activeTab === 'policy' && (
              <div className="text-[12px] leading-10 text-zinc-500 uppercase tracking-widest space-y-4">
                <p>• Miễn phí vận chuyển cho đơn hàng từ 1.000.000đ.</p>
                <p>• Hỗ trợ đổi size trong vòng 7 ngày kể từ lúc nhận hàng.</p>
                <p>• Hoàn tiền 100% nếu phát hiện hàng lỗi từ nhà sản xuất.</p>
              </div>
            )}
            
            {/* 🚀 TAB BÌNH LUẬN & ĐÁNH GIÁ */}
            {activeTab === 'reviews' && (
              <div className="space-y-16">
                
                {/* FORM VIẾT ĐÁNH GIÁ MỚI */}
                <form onSubmit={handleSubmitReview} className="bg-zinc-50 p-8 border border-zinc-100 space-y-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-black uppercase tracking-[3px] mb-3">Chất lượng sản phẩm</h4>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                          <Star size={24} fill={star <= rating ? "#000" : "none"} strokeWidth={1} className={star <= rating ? "text-black" : "text-zinc-300"} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-black uppercase tracking-[3px] mb-3">Trải nghiệm của bạn</h4>
                    <textarea value={reviewContent} onChange={(e) => setReviewContent(e.target.value)} placeholder="Chia sẻ cảm nghĩ của bạn về sản phẩm này..." className="w-full bg-white border border-zinc-200 p-4 text-sm outline-none focus:border-black transition-colors min-h-[120px]" required></textarea>
                  </div>
                  <button type="submit" disabled={submittingReview} className="bg-black text-white px-8 py-4 text-[10px] font-bold uppercase tracking-[3px] hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center gap-2">
                    <Send size={14}/> {submittingReview ? 'ĐANG GỬI...' : 'GỬI ĐÁNH GIÁ'}
                  </button>
                </form>

                {/* DANH SÁCH BÌNH LUẬN */}
                <div className="space-y-12">
                  {reviews.length === 0 ? (
                    <div className="text-center py-10">
                      <MessageSquare size={48} strokeWidth={0.5} className="mx-auto text-zinc-200 mb-6" />
                      <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[4px]">Sản phẩm này hiện chưa có phản hồi.</p>
                    </div>
                  ) : (
                    reviews.map(review => (
                      <div key={review._id} className="border-b border-zinc-100 pb-10">
                        {/* REVIEW GỐC */}
                        <div className="flex items-start gap-5 mb-4">
                          <div className="w-12 h-12 bg-zinc-100 flex items-center justify-center font-bold text-zinc-500 uppercase shrink-0">
                            {review.user?.fullName?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-grow space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="text-[12px] font-bold uppercase tracking-widest text-black">{review.user?.fullName || 'Người dùng'}</h5>
                                <div className="flex gap-1 mt-1">
                                  {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < review.rating ? "#000" : "none"} className={i < review.rating ? "text-black" : "text-zinc-300"} />)}
                                </div>
                              </div>
                              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <p className="text-sm text-zinc-600 leading-relaxed pt-2">{review.content}</p>
                            <button onClick={() => setReplyingTo(replyingTo === review._id ? null : review._id)} className="text-[10px] font-bold uppercase tracking-[2px] text-zinc-400 hover:text-black transition flex items-center gap-1 pt-2">
                              <MessageSquare size={12}/> Phản hồi
                            </button>
                          </div>
                        </div>

                        {/* DANH SÁCH TRẢ LỜI (REPLIES) */}
                        {review.replies && review.replies.length > 0 && (
                          <div className="ml-17 pl-6 border-l-2 border-zinc-100 space-y-6 mt-6">
                            {review.replies.map(reply => (
                              <div key={reply._id} className="flex items-start gap-4">
                                <div className={`w-8 h-8 flex items-center justify-center font-bold text-[10px] uppercase shrink-0 ${reply.user?.role === 'admin' ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                                  {reply.user?.fullName?.charAt(0) || 'A'}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h6 className={`text-[11px] font-bold uppercase tracking-widest ${reply.user?.role === 'admin' ? 'text-black' : 'text-zinc-600'}`}>
                                      {reply.user?.role === 'admin' ? 'Admin Shop' : (reply.user?.fullName || 'Người dùng')}
                                    </h6>
                                    <span className="text-[9px] text-zinc-400">• {new Date(reply.createdAt).toLocaleDateString('vi-VN')}</span>
                                  </div>
                                  <p className="text-[13px] text-zinc-600 leading-relaxed mt-1">{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* FORM TRẢ LỜI */}
                        {replyingTo === review._id && (
                          <div className="ml-17 mt-6 flex gap-3">
                            <CornerDownRight size={20} className="text-zinc-300 shrink-0 mt-2"/>
                            <div className="flex-grow flex gap-2">
                              <input type="text" value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Viết câu trả lời..." className="flex-grow bg-zinc-50 border border-zinc-200 p-3 text-sm outline-none focus:border-black transition-colors" />
                              <button onClick={() => handleSubmitReply(review._id)} className="bg-black text-white px-6 font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition">Gửi</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};