import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { Star, Trash2, MessageSquare, CornerDownRight, CheckCircle, AlertCircle, ExternalLink, Hexagon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminReviewManager = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State cho việc Reply
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const BASE_URL = "http://localhost:5000";

  // Helper xử lý ảnh
  const getImgUrl = (path) => {
    if (!path) return 'https://placehold.co/100x100?text=No+Image';
    if (path.startsWith('data:') || path.startsWith('blob:')) return path;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${BASE_URL}/${cleanPath}`;
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/reviews/admin/all');
      if (res.data.success) {
        setReviews(res.data.data);
      }
    } catch (error) {
      toast.error('Lỗi tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  // 🚀 XÓA ĐÁNH GIÁ
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này không? Mọi câu trả lời cũng sẽ bị xóa theo.')) return;
    try {
      const res = await axiosInstance.delete(`/reviews/${id}`);
      if (res.data.success) {
        toast.success('Đã xóa đánh giá');
        setReviews(reviews.filter(r => r._id !== id));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa');
    }
  };

  // 🚀 GỬI TRẢ LỜI
  const handleSubmitReply = async (reviewId) => {
    if (!replyContent.trim()) return toast.error("Vui lòng nhập nội dung trả lời!");
    try {
      setSubmittingReply(true);
      const res = await axiosInstance.post(`/reviews/${reviewId}/reply`, {
        content: replyContent
      });
      if (res.data.success) {
        toast.success("Đã trả lời đánh giá!");
        setReplyingTo(null);
        setReplyContent('');
        fetchReviews(); // Kéo lại data để hiện câu trả lời mới
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi gửi trả lời");
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-gray-400 animate-pulse text-[10px] uppercase tracking-[3px]">ĐANG TẢI DỮ LIỆU...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20 selection:bg-black selection:text-white">
      <div className="flex justify-between items-center mb-10 h-20 border-b border-zinc-100">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-1 text-black">📋 Quản lý Đánh giá</h1>
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[2px]">Có tổng cộng {reviews.length} đánh giá trên hệ thống</p>
        </div>
      </div>

      <div className="space-y-8">
        {reviews.length === 0 ? (
          <div className="bg-white p-20 rounded-3xl border text-center text-zinc-300 text-[10px] uppercase font-black tracking-[4px]">Chưa có đánh giá nào.</div>
        ) : (
          reviews.map((review) => {
            // Kiểm tra xem Admin đã rep chưa
            const hasAdminReplied = review.replies?.some(r => r.user?.role === 'admin');

            return (
              <div key={review._id} className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col md:flex-row transition-all hover:border-zinc-200">
                
                {/* THÔNG TIN SẢN PHẨM (Cột trái) */}
                <div className="w-full md:w-60 bg-zinc-50/50 p-6 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-zinc-100 shrink-0">
                  <div className="relative aspect-[3/4] w-28 rounded-2xl overflow-hidden border shadow-inner mb-4 bg-white">
                    <img 
                      src={getImgUrl(review.product?.images?.[0])} 
                      alt="product" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Link to={`/products/${review.product?._id}`} className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-black transition flex items-center gap-1.5">
                    {review.product?.name || 'Sản phẩm已删除'} <ExternalLink size={12} className="shrink-0"/>
                  </Link>
                </div>

                {/* NỘI DUNG ĐÁNH GIÁ & ACTIONS (Cột phải) */}
                <div className="p-8 flex-grow flex flex-col justify-between space-y-8">
                  <div>
                    {/* Header: User + Status */}
                    <div className="flex justify-between items-start mb-6 pb-6 border-b border-zinc-50">
                      <div className="flex items-center gap-4">
                        {/* 🚀 3. ĐÃ SỬA: Lấy tên hoặc Avatar để hiển thị thay vì "Người Dùng" */}
                        {review.user?.avatar ? (
                            <img src={getImgUrl(review.user.avatar)} className="w-12 h-12 rounded-full object-cover border"/>
                        ) : (
                            <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-black uppercase text-lg shadow-inner">
                            {review.user?.fullName?.charAt(0) || 'U'}
                            </div>
                        )}
                        <div>
                          <p className="text-sm font-black text-black uppercase tracking-tight">{review.user?.fullName || 'Người dùng ẩn danh'}</p>
                          <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-[2px]">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>

                      {/* Badge Trạng thái */}
                      <div className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 ${hasAdminReplied ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {hasAdminReplied ? <><CheckCircle size={14}/> Đã phản hồi</> : <><AlertCircle size={14}/> Cần xử lý</>}
                      </div>
                    </div>

                    {/* Nội dung Review */}
                    <div className="mb-8">
                      <div className="flex gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} fill={i < review.rating ? "#000" : "none"} className={i < review.rating ? "text-black" : "text-zinc-200"} strokeWidth={1}/>
                        ))}
                      </div>
                      <p className="text-sm text-zinc-800 leading-relaxed font-medium bg-zinc-50/50 p-5 rounded-xl border border-zinc-100">{review.content}</p>
                    </div>

                    {/* 🚀 2. ĐÃ THÊM: Dòng chữ mờ "Admin đã trả lời" */}
                    {hasAdminReplied && (
                        <div className="flex items-center gap-2 mb-6 ml-6">
                            <CornerDownRight size={14} className="text-zinc-300"/>
                            <span className="text-[10px] font-black uppercase tracking-[3px] text-zinc-300">Shop đã phản hồi đánh giá này</span>
                        </div>
                    )}

                    {/* 🚀 1. ĐÃ SỬA UI: "Thụt vào" dứt khoát hơn (ml-10 + ml-10) */}
                    {review.replies && review.replies.length > 0 && (
                      <div className="space-y-6 mt-6 ml-6 pl-8 border-l-2 border-zinc-100">
                        {review.replies.map(reply => (
                          <div key={reply._id} className="flex items-start gap-4 hover:bg-zinc-50/50 p-2 rounded-lg transition">
                            {/* Avatar của Reply */}
                            {reply.user?.avatar ? (
                                <img src={getImgUrl(reply.user.avatar)} className="w-9 h-9 rounded-full object-cover border"/>
                            ) : (
                                <div className={`w-9 h-9 flex items-center justify-center rounded-full font-black text-xs uppercase shrink-0 ${reply.user?.role === 'admin' ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                                    {reply.user?.fullName?.charAt(0) || 'A'}
                                </div>
                            )}
                            
                            <div>
                              <p className={`text-[11px] font-black uppercase tracking-widest ${reply.user?.role === 'admin' ? 'text-black' : 'text-zinc-500'}`}>
                                {reply.user?.role === 'admin' ? 'Admin Shop' : reply.user?.fullName}
                              </p>
                              <p className="text-[13px] text-zinc-700 font-medium leading-relaxed mt-1.5">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hành động (Actions) */}
                  <div className="flex items-center gap-3 pt-6 border-t border-zinc-50">
                    <button 
                      onClick={() => setReplyingTo(replyingTo === review._id ? null : review._id)}
                      className="text-[11px] font-black uppercase tracking-[2px] flex items-center gap-2.5 px-6 py-3.5 bg-black text-white hover:bg-zinc-800 transition rounded-full shadow-lg shadow-black/5"
                    >
                      <MessageSquare size={16}/> {replyingTo === review._id ? 'Đóng khung' : 'Trả lời'}
                    </button>
                    
                    <button 
                      onClick={() => handleDelete(review._id)}
                      className="text-[11px] font-black uppercase tracking-[2px] flex items-center gap-2.5 px-6 py-3.5 text-red-600 hover:bg-red-50 transition rounded-full ml-auto"
                    >
                      <Trash2 size={16}/> Xóa
                    </button>
                  </div>

                  {/* Khung nhập Reply (Mở ra khi bấm Trả lời) */}
                  {replyingTo === review._id && (
                    <div className="mt-6 flex gap-3 border-t border-zinc-50 pt-6">
                      <CornerDownRight size={20} className="text-zinc-300 shrink-0 mt-3"/>
                      <div className="flex-grow flex gap-2.5 items-center">
                        <input 
                          type="text" 
                          value={replyContent} 
                          onChange={(e) => setReplyContent(e.target.value)} 
                          placeholder="Viết phản hồi chính thức từ Admin..." 
                          className="flex-grow bg-white border border-zinc-200 rounded-xl p-4 text-sm outline-none focus:border-black transition-colors min-h-[50px]"
                          autoFocus
                        />
                        <button 
                          onClick={() => handleSubmitReply(review._id)}
                          disabled={submittingReply}
                          className="bg-zinc-950 h-full text-white px-8 rounded-xl font-black text-[11px] uppercase tracking-[3px] hover:bg-black transition disabled:opacity-50 flex items-center gap-2"
                        >
                          {submittingReply ? 'ĐANG GỬI...' : 'GỬI PHẢN HỒI'}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};