import { createContext, useContext, useState } from 'react';
import BookServiceModal from '../components/BookServiceModal';

const BookingModalContext = createContext({
  openBookingModal: () => {},
  closeBookingModal: () => {},
});

export function BookingModalProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    puja: null,
    pandit: null,
    serviceTitle: '',
    tierName: 'Standard',
    defaultSamagri: true,
  });

  const openBookingModal = (opts = {}) => {
    setModalState({
      isOpen: true,
      puja: opts.puja || null,
      pandit: opts.pandit || null,
      serviceTitle:
        opts.serviceTitle ||
        opts.puja?.name ||
        (opts.pandit?.user?.name ? `Priest Booking — ${opts.pandit.user.name}` : 'Vedic Puja / Homam Service'),
      tierName: opts.tierName || opts.puja?.priceTiers?.[0]?.name || 'Standard',
      defaultSamagri: opts.defaultSamagri !== undefined ? opts.defaultSamagri : true,
    });
  };

  const closeBookingModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <BookingModalContext.Provider value={{ openBookingModal, closeBookingModal }}>
      {children}
      {modalState.isOpen && (
        <BookServiceModal
          initialData={modalState}
          onClose={closeBookingModal}
        />
      )}
    </BookingModalContext.Provider>
  );
}

export function useBookingModal() {
  return useContext(BookingModalContext);
}

