'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, Settings, ShoppingBag, X, ChevronRight, CheckCircle2, Copy, Check } from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: number | string;
  Name: string;
  Price_4_Pack: number;
  In_Stock_4: boolean;
  Price_8_Pack: number;
  In_Stock_8: boolean;
  Image: string;
}


export default function ShailasPotliApp() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  
  // Form Errors
  const [formErrors, setFormErrors] = useState<{phone?: string; address?: string}>({});
  
  // Checkout State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<4 | 8 | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  
  // Payment Flow
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'payment' | 'success'>('details');
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  async function fetchProducts(url: string) {
    setLoading(true);
    setStoreError(null);
    if (!url) {
      setStoreError("Store URL is not configured. Please set NEXT_PUBLIC_GAS_URL environment variable.");
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data);
      } else {
        setStoreError("No products found in the database.");
        setProducts([]);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setStoreError("Failed to load products. Please check the Web App URL.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  const gasUrl = process.env.NEXT_PUBLIC_GAS_URL || '';
  const upiVpa = process.env.NEXT_PUBLIC_UPI_VPA || '';

  useEffect(() => {
    fetchProducts(gasUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize(product.In_Stock_4 ? 4 : product.In_Stock_8 ? 8 : null);
    setQuantity(1);
    setCheckoutStep('details');
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCheckoutStep('details');
    setOrderError(null);
    setFormErrors({});
  };

  const calculateTotal = () => {
    if (!selectedProduct || !selectedSize) return 0;
    const price = selectedSize === 4 ? selectedProduct.Price_4_Pack : selectedProduct.Price_8_Pack;
    return price * quantity;
  };

  const handleCopyUpi = () => {
    if (upiVpa) {
      navigator.clipboard.writeText(upiVpa);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const validateForm = () => {
    const errors: {phone?: string; address?: string} = {};
    if (!customerPhone || customerPhone.replace(/\D/g, '').length < 10) {
      errors.phone = "Please enter a valid 10-digit phone number";
    }
    if (!customerAddress || customerAddress.trim().length < 10) {
      errors.address = "Please enter a complete delivery address";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirmOrder = async () => {
    setOrderSubmitting(true);
    setOrderError(null);

    if (!gasUrl) {
      setOrderError("Store is not configured properly (missing NEXT_PUBLIC_GAS_URL).");
      setOrderSubmitting(false);
      return;
    }

    const orderData = {
      Name: customerName,
      Phone: customerPhone,
      Address: customerAddress,
      Product: selectedProduct?.Name,
      Size: `${selectedSize}-Pack`,
      Quantity: quantity,
      Total_Price: calculateTotal(),
      Payment_Status: "PAID - PENDING VERIFICATION"
    };

    try {
      await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      setCheckoutStep('success');
    } catch (err) {
      console.error("Failed to submit order", err);
      setOrderError("Failed to submit order. Please check your network and try again.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col font-sans bg-[#FAF6F0] text-[#2C2623] overflow-hidden">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-center border-b border-[#2C2623]/15 py-4 bg-[#FAF6F0] z-10">
        <img src="assets/stamp.png" alt="Shaila's Potli Logo" className="h-28" />
      </header>

      {/* Main Content Split */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Pane: Catalog */}
        <div className={`w-full ${selectedProduct ? 'hidden lg:block lg:w-3/5' : 'lg:w-full'} p-6 lg:p-12 overflow-y-auto border-r-0 lg:border-r border-[#2C2623]/15 custom-scrollbar`}>
          <h2 className="text-xl mb-8 italic font-serif">Browse Products</h2>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#C05C3E]" />
            </div>
          ) : storeError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
              <p className="text-sm">{storeError}</p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 md:grid-cols-2 ${selectedProduct ? '' : 'lg:grid-cols-3'} gap-8`}>
              {products.map(product => (
                <div key={product.id} className="group cursor-pointer flex flex-col pb-6 border-b border-[#2C2623]/15" onClick={() => handleProductSelect(product)}>
                  <div className="relative aspect-square mb-4 overflow-hidden bg-[#EAE3DB] rounded-sm border border-[#2C2623]/10">
                    {product.Image ? (
                      <img 
                        src={product.Image} 
                        alt={product.Name}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#EAE3DB]"></div>
                    )}
                    {(!product.In_Stock_4 && !product.In_Stock_8) && (
                       <div className="absolute inset-0 bg-[#FAF6F0]/60 backdrop-blur-sm flex items-center justify-center">
                         <span className="font-medium text-sm tracking-wider uppercase opacity-70">Out of Stock</span>
                       </div>
                    )}
                  </div>
                  <h3 className="font-serif text-lg mb-1">{product.Name}</h3>
                  <div className="flex justify-between items-center mt-auto">
                     <p className="text-xs opacity-60">
                       From ₹{product.Price_4_Pack}
                     </p>
                     <span className="text-[#C05C3E] opacity-0 group-hover:opacity-100 transition-opacity">
                       <ShoppingBag className="w-5 h-5" />
                     </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Right Pane: Checkout */}
        {selectedProduct ? (
          <div className="w-full lg:w-2/5 p-6 lg:p-12 bg-[#F7F2EB] flex flex-col overflow-y-auto relative custom-scrollbar">
            {/* Mobile close button */}
            <button onClick={closeModal} className="lg:hidden absolute top-6 right-6 p-2 hover:bg-[#2C2623]/5 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl mb-8 italic font-serif">Order Details</h2>

            <div className="flex-grow flex flex-col">
              
              {checkoutStep === 'details' && (
                <div className="space-y-8 flex-grow mb-8">
                  <div className="pb-6 border-b border-[#2C2623]/15">
                    <h3 className="font-serif text-xl mb-1">{selectedProduct.Name}</h3>
                    <p className="text-xs opacity-60">Select your preferred pack size</p>
                  </div>

                  {/* Size Selection */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest opacity-50 block mb-3">Pack Size</label>
                    <div className="flex flex-col gap-4">
                      <label className={`flex items-center gap-3 cursor-pointer ${!selectedProduct.In_Stock_4 ? 'opacity-40 pointer-events-none' : ''}`}>
                        <input type="radio" name="packSize" className="accent-[#C05C3E] w-4 h-4" checked={selectedSize === 4} onChange={() => selectedSize !== 4 && setSelectedSize(4)} disabled={!selectedProduct.In_Stock_4} />
                        <span className={`text-sm ${!selectedProduct.In_Stock_4 ? 'line-through' : ''}`}>4-Pack — ₹{selectedProduct.Price_4_Pack} {(!selectedProduct.In_Stock_4) && '(Out of Stock)'}</span>
                      </label>
                      <label className={`flex items-center gap-3 cursor-pointer ${!selectedProduct.In_Stock_8 ? 'opacity-40 pointer-events-none' : ''}`}>
                        <input type="radio" name="packSize" className="accent-[#C05C3E] w-4 h-4" checked={selectedSize === 8} onChange={() => selectedSize !== 8 && setSelectedSize(8)} disabled={!selectedProduct.In_Stock_8} />
                        <span className={`text-sm ${!selectedProduct.In_Stock_8 ? 'line-through' : ''}`}>8-Pack — ₹{selectedProduct.Price_8_Pack} {(!selectedProduct.In_Stock_8) && '(Out of Stock)'}</span>
                      </label>
                    </div>
                  </div>

                  {/* Quantity */}
                  {selectedSize && (
                    <div>
                      <label className="text-[10px] uppercase tracking-widest opacity-50 block mb-3">Quantity</label>
                      <div className="flex items-center space-x-4">
                        <button 
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-10 h-10 border border-[#2C2623]/20 flex items-center justify-center bg-transparent hover:bg-[#2C2623]/5 transition-colors text-lg"
                        >-</button>
                        <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                        <button 
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-10 h-10 border border-[#2C2623]/20 flex items-center justify-center bg-transparent hover:bg-[#2C2623]/5 transition-colors text-lg"
                        >+</button>
                      </div>
                    </div>
                  )}

                  {/* Customer Details */}
                  {selectedSize && (
                    <div className="space-y-6 pt-2">
                       <div>
                         <label className="text-[10px] uppercase tracking-widest opacity-50 block mb-1">Delivery Name</label>
                         <input 
                           type="text" 
                           placeholder="Full Name" 
                           value={customerName}
                           onChange={e => setCustomerName(e.target.value)}
                           className="bg-transparent border-b border-[#2C2623]/30 py-2 outline-none w-full text-sm transition-colors focus:border-[#C05C3E] placeholder:opacity-40"
                         />
                       </div>
                       <div>
                         <label className="text-[10px] uppercase tracking-widest opacity-50 block mb-1 flex justify-between">
                           <span>WhatsApp / Phone</span>
                           {formErrors.phone && <span className="text-red-500 font-medium normal-case">{formErrors.phone}</span>}
                         </label>
                         <input 
                           type="tel" 
                           placeholder="+91" 
                           value={customerPhone}
                           onChange={e => {
                             setCustomerPhone(e.target.value);
                             if (formErrors.phone) setFormErrors(prev => ({...prev, phone: undefined}));
                           }}
                           className={`bg-transparent border-b ${formErrors.phone ? 'border-red-500' : 'border-[#2C2623]/30'} py-2 outline-none w-full text-sm transition-colors focus:border-[#C05C3E] placeholder:opacity-40`}
                         />
                       </div>
                       <div>
                         <label className="text-[10px] uppercase tracking-widest opacity-50 block mb-1 flex justify-between">
                           <span>Full Address</span>
                           {formErrors.address && <span className="text-red-500 font-medium normal-case">{formErrors.address}</span>}
                         </label>
                         <textarea 
                           placeholder="Street, City, Pincode..." 
                           rows={2}
                           value={customerAddress}
                           onChange={e => {
                             setCustomerAddress(e.target.value);
                             if (formErrors.address) setFormErrors(prev => ({...prev, address: undefined}));
                           }}
                           className={`bg-transparent border-b ${formErrors.address ? 'border-red-500' : 'border-[#2C2623]/30'} py-2 outline-none w-full text-sm transition-colors focus:border-[#C05C3E] placeholder:opacity-40 resize-none h-16`}
                         />
                       </div>
                    </div>
                  )}
                </div>
              )}

              {checkoutStep === 'payment' && (
                <div className="flex flex-col flex-grow py-6">
                   <h4 className="font-serif text-xl mb-2">Complete Payment</h4>
                   
                   <div className="flex gap-6 items-center p-4 bg-white/40 rounded-sm border border-[#2C2623]/15 mb-4 mt-4">
                      <div className="w-[100px] h-[100px] border border-[#2C2623]/10 flex items-center justify-center bg-white shrink-0">
                        {upiVpa ? (
                          <QRCodeSVG 
                            value={`upi://pay?pa=${upiVpa}&pn=Shailas%20Potli&am=${calculateTotal()}&tn=Order-${encodeURIComponent(customerName)}`}
                            size={80}
                            bgColor="#ffffff"
                            fgColor="#2C2623"
                          />
                        ) : (
                          <div className="text-[10px] text-center opacity-50 p-2 leading-tight">UPI VPA NOT CONFIGURED</div>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Scan to Pay via UPI</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-mono">{upiVpa || 'Not Configured'}</p>
                          {upiVpa && (
                            <button onClick={handleCopyUpi} className="p-1.5 hover:bg-[#2C2623]/5 rounded transition-colors" title="Copy UPI ID">
                              {copiedUpi ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                   </div>

                   {upiVpa && (
                     <a 
                       href={`upi://pay?pa=${upiVpa}&pn=Shailas%20Potli&am=${calculateTotal()}&tn=Order-${encodeURIComponent(customerName)}`}
                       className="block w-full text-center border border-[#C05C3E] text-[#C05C3E] py-3 text-[10px] tracking-widest uppercase hover:bg-[#C05C3E]/5 transition-colors mb-6"
                     >
                       Pay using UPI App
                     </a>
                   )}

                   <p className="text-sm opacity-70 mb-6 leading-relaxed">
                     Once you have paid the exact amount via UPI, click &quot;Confirm Order&quot; to notify us.
                   </p>
                </div>
              )}

              {checkoutStep === 'success' && (
                <div className="flex flex-col items-center justify-center flex-grow py-12 text-center">
                   <CheckCircle2 className="w-12 h-12 text-[#C05C3E] mb-4" strokeWidth={1} />
                   <h4 className="font-serif text-2xl mb-3">Order Received</h4>
                   <p className="opacity-70 mb-8 max-w-sm text-sm leading-relaxed">
                     Thank you, {customerName}. Your order details have been securely captured. Once payment is verified, we will begin packing your handcrafted potli.
                   </p>
                   <button 
                     onClick={closeModal}
                     className="px-8 py-3 border border-[#2C2623]/20 hover:bg-[#2C2623]/5 transition-colors text-[10px] tracking-widest uppercase"
                   >
                     Back to Store
                   </button>
                </div>
              )}
              
              {/* Checkout Fixed Footer block inside Right Pane */}
              {checkoutStep !== 'success' && (
                <div className="pt-6 border-t border-[#2C2623]/15 mt-auto">
                  <div className="flex justify-between items-center mb-6">
                     <span className="text-sm">Total Payable</span>
                     <span className="text-xl font-medium tracking-tight font-sans">₹{calculateTotal()}</span>
                  </div>

                  {orderError && (
                    <div className="text-red-600/90 text-xs text-center mb-4 pb-2">
                       {orderError}
                    </div>
                  )}
                  
                  {checkoutStep === 'details' ? (
                    <div>
                      {!upiVpa && (
                        <p className="text-[10px] text-red-600/80 text-center mb-2 uppercase tracking-widest">Setup UPI VPA in Settings to checkout</p>
                      )}
                      <button 
                        onClick={() => {
                          if (validateForm()) setCheckoutStep('payment');
                        }}
                        disabled={!selectedSize || !customerName.trim() || !customerPhone.trim() || !customerAddress.trim() || !upiVpa}
                        className="w-full bg-[#C05C3E] text-[#FAF6F0] py-4 text-[10px] tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Proceed to Pay
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={handleConfirmOrder}
                      disabled={orderSubmitting}
                      className="w-full bg-[#C05C3E] text-[#FAF6F0] py-4 text-[10px] tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                      {orderSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Order"}
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>
        ) : (
          <div className="hidden lg:flex w-2/5 bg-[#F7F2EB] items-center justify-center p-12 text-center pointer-events-none select-none border-l border-[#2C2623]/5">
             <p className="text-[10px] uppercase tracking-widest opacity-40">Select an item from the catalog to view details</p>
          </div>
        )}

<a
  href="https://wa.me/917304070829?text=Hello%20Shaila's%20Potli%0A%0AI%20would%20like%20to%20know%20more%20about%20your%20Laddoos%20and%20place%20an%20order."  target="_blank"
  rel="noopener noreferrer"
  aria-label="Contact us on WhatsApp"
  className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-transform hover:scale-110"
>
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-whatsapp" viewBox="0 0 16 16">
  <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
</svg>
</a>

      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-[#2C2623]/15 px-12 flex shrink-0 items-center justify-between text-[10px] uppercase tracking-widest opacity-40 bg-[#FAF6F0] z-10">
        <span>&copy; {new Date().getFullYear()} Shaila&apos;s Potli - All Rights Reserved By Cindral OPC Pvt Ltd</span>
      </footer>

    </div>
  );
}