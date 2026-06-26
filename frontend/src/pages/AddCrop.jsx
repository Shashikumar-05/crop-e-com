import { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function AddCrop() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    cropName: '',
    description: '',
    availableStock: '',
    pricePerUnit: '',
    unit: 'kg',
    farmLocation: '',
  });

  const [image, setImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const { cropName, description, availableStock, pricePerUnit, unit, farmLocation } = formData;

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const uploadFileHandler = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();

    reader.onloadend = () => {
      setImage(reader.result); // This is the Base64 string
      setUploading(false);
    };

    reader.onerror = () => {
      console.error('Failed to read file');
      setError('Image upload failed');
      setUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Ensure we send correct data structure, and include token in headers
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.token) {
      setError(t('add_crop.login_required'));
      return;
    }

    try {
      const cropData = {
        ...formData,
        photos: image ? [image] : [], // Pass single image in array syntax as defined in model
      };

      await api.post('/api/crops', cropData);
      setMessage(t('add_crop.success_msg'));
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : t('add_crop.fail_msg')
      );
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '2.2rem' }}>{t('add_crop.title')}</h1>
        <p style={{ margin: 0, color: 'var(--neutral-500)', fontSize: '1.05rem' }}>{t('add_crop.subtitle')}</p>
      </div>
      
      {message && (
        <div style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)', padding: '15px 20px', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid var(--primary-200)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          {message}
        </div>
      )}
      
      {error && (
        <div style={{ backgroundColor: '#fef2f2', color: 'var(--danger)', padding: '15px 20px', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #fecaca' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {error}
        </div>
      )}
      
      <div className="card">
        <form onSubmit={onSubmit} className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--neutral-800)' }}>{t('add_crop.crop_name')}</label>
            <input
              type="text"
              name="cropName"
              value={cropName}
              onChange={onChange}
              placeholder={t('add_crop.crop_name_ph')}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--neutral-800)' }}>{t('add_crop.description')}</label>
            <textarea
              name="description"
              value={description}
              onChange={onChange}
              placeholder={t('add_crop.description_ph')}
              rows="3"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--neutral-800)' }}>{t('add_crop.farm_location')}</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <input
                type="text"
                name="farmLocation"
                value={farmLocation}
                onChange={onChange}
                placeholder={t('add_crop.farm_location_ph')}
                required
                style={{ width: '100%', paddingLeft: '38px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--neutral-800)' }}>{t('add_crop.total_stock')}</label>
            <input
              type="number"
              name="availableStock"
              value={availableStock}
              onChange={onChange}
              placeholder={t('add_crop.total_stock_ph')}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--neutral-800)' }}>{t('add_crop.unit_label')}</label>
            <select
              name="unit"
              value={unit}
              onChange={onChange}
              style={{ width: '100%' }}
            >
              <option value="kg">{t('add_crop.unit_kg')}</option>
              <option value="quintal">{t('add_crop.unit_quintal')}</option>
              <option value="ton">{t('add_crop.unit_ton')}</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--neutral-800)' }}>{t('add_crop.price_label')} <span style={{ color: 'var(--neutral-500)', fontWeight: '400' }}>{t('add_crop.per_unit')} {unit}</span></label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-600)', fontWeight: '600' }}>₹</span>
              <input
                type="number"
                name="pricePerUnit"
                value={pricePerUnit}
                onChange={onChange}
                placeholder="45"
                required
                style={{ width: '100%', paddingLeft: '30px' }}
              />
            </div>
          </div>

          {/* Styled Image Upload Dropzone */}
          <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--neutral-800)' }}>{t('add_crop.crop_photo')}</label>
            
            <div style={{ 
              border: '2px dashed var(--neutral-300)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '30px 20px', 
              textAlign: 'center',
              backgroundColor: 'var(--neutral-50)',
              transition: 'border-color 0.2s, background-color 0.2s',
              position: 'relative'
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary-400)'; e.currentTarget.style.backgroundColor = 'var(--primary-50)'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--neutral-300)'; e.currentTarget.style.backgroundColor = 'var(--neutral-50)'; }}
            >
              {uploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: 'var(--primary-600)' }}>
                  <div style={{ width: '24px', height: '24px', border: '3px solid var(--primary-200)', borderTopColor: 'var(--primary-600)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  <span style={{ fontWeight: '500' }}>{t('add_crop.uploading')}</span>
                </div>
              ) : image ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '2px solid var(--primary-500)', padding: '2px' }}>
                     <img src={image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'calc(var(--radius-md) - 2px)' }} />
                  </div>
                  <span style={{ color: 'var(--primary-700)', fontWeight: '500', fontSize: '0.9rem' }}>{t('add_crop.upload_success')}</span>
                  <input type="file" onChange={uploadFileHandler} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: 'var(--neutral-500)' }}>
                  <div style={{ backgroundColor: 'var(--white)', padding: '12px', borderRadius: '50%', boxShadow: 'var(--shadow-sm)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: 'var(--primary-600)' }}>{t('add_crop.click_to_upload')}</span> {t('add_crop.drag_and_drop')}
                  </div>
                  <span style={{ fontSize: '0.85rem' }}>{t('add_crop.file_types')}</span>
                  <input type="file" onChange={uploadFileHandler} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                </div>
              )}
            </div>
            
            {/* Hidden input to hold state */}
            <input type="hidden" value={image} name="imageUrl" />
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={uploading}
              style={{ fontSize: '1.1rem', padding: '14px' }}
            >
              {t('add_crop.publish_btn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCrop;
