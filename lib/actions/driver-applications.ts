'use server';

// ============================================================
// Engz Driver Applications Server Actions
// ============================================================

import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/services/auth';
import { driverApplicationSchema } from '@/lib/validations';

export interface DriverApplicationState {
  success?: boolean;
  error?: string;
  applicationId?: string;
}

export interface DriverApprovalResult {
  success?: boolean;
  error?: string;
  driverPhone?: string;
  tempPassword?: string;
  driverName?: string;
  whatsappUrl?: string;
}

/**
 * Submit a new driver registration application.
 * Accepts full name, age, phone, address, vehicle type, and ID card front & back photos.
 */
export async function submitDriverApplicationAction(
  prevState: DriverApplicationState | null,
  formData: FormData
): Promise<DriverApplicationState> {
  try {
    const rawData = {
      full_name: (formData.get('full_name') as string)?.trim() || '',
      age: formData.get('age') as string,
      phone: (formData.get('phone') as string)?.trim().replace(/\s/g, '') || '',
      address: (formData.get('address') as string)?.trim() || '',
      vehicle_type: (formData.get('vehicle_type') as string)?.trim() || 'موتوسيكل',
    };

    const validation = driverApplicationSchema.safeParse(rawData);
    if (!validation.success) {
      return { error: validation.error.issues[0]?.message || 'البيانات المدخلة غير صحيحة' };
    }

    const frontFile = formData.get('id_card_front') as File | null;
    const backFile = formData.get('id_card_back') as File | null;
    const photoFile = formData.get('personal_photo') as File | null;

    if (!frontFile || !(frontFile instanceof File) || frontFile.size === 0) {
      return { error: 'يرجى رفع صورة واضحة لوجه البطاقة الشخصية' };
    }

    if (!backFile || !(backFile instanceof File) || backFile.size === 0) {
      return { error: 'يرجى رفع صورة واضحة لظهر البطاقة الشخصية' };
    }

    if (!photoFile || !(photoFile instanceof File) || photoFile.size === 0) {
      return { error: 'يرجى رفع صورة شخصية واضحة للطيار' };
    }

    // Authenticity & Validity Checks:
    if (frontFile.size < 20000 || backFile.size < 20000 || photoFile.size < 20000) {
      return { error: 'حجم إحدى الصور صغير جداً وغير واضح، يرجى التقاط صور واضحة ومقروءة' };
    }

    // Maximum 10MB
    if (frontFile.size > 10 * 1024 * 1024 || backFile.size > 10 * 1024 * 1024 || photoFile.size > 10 * 1024 * 1024) {
      return { error: 'حجم الصورة كبير جداً، الحد الأقصى 10 ميجابايت' };
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(frontFile.type) || !allowedTypes.includes(backFile.type) || !allowedTypes.includes(photoFile.type)) {
      return { error: 'صيغة إحدى الصور غير مدعومة، يرجى رفع صور بصيغة JPG أو PNG أو WEBP' };
    }

    const adminSupabase = await createAdminClient();

    // Check if there is already a pending application with this phone
    const { data: existingApp } = await adminSupabase
      .from('driver_applications')
      .select('id, status')
      .eq('phone', validation.data.phone)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingApp) {
      return { error: 'يوجد طلب انضمام قيد المراجعة بالفعل لهذا الرقم، سيتم الرد عليك قريباً' };
    }

    // Upload Front ID Card to storage
    const frontExt = frontFile.name.split('.').pop() || 'jpg';
    const frontFileName = `id_front_${validation.data.phone}_${Date.now()}.${frontExt}`;
    const frontBuffer = Buffer.from(await frontFile.arrayBuffer());

    await adminSupabase.storage
      .from('id-documents')
      .upload(frontFileName, frontBuffer, { contentType: frontFile.type, upsert: true });

    // Upload Back ID Card to storage
    const backExt = backFile.name.split('.').pop() || 'jpg';
    const backFileName = `id_back_${validation.data.phone}_${Date.now()}.${backExt}`;
    const backBuffer = Buffer.from(await backFile.arrayBuffer());

    await adminSupabase.storage
      .from('id-documents')
      .upload(backFileName, backBuffer, { contentType: backFile.type, upsert: true });

    // Upload Personal Photo to storage
    const photoExt = photoFile.name.split('.').pop() || 'jpg';
    const photoFileName = `photo_${validation.data.phone}_${Date.now()}.${photoExt}`;
    const photoBuffer = Buffer.from(await photoFile.arrayBuffer());

    await adminSupabase.storage
      .from('avatars')
      .upload(photoFileName, photoBuffer, { contentType: photoFile.type, upsert: true });

    // Get URLs
    const { data: frontUrlData } = adminSupabase.storage.from('id-documents').getPublicUrl(frontFileName);
    const { data: backUrlData } = adminSupabase.storage.from('id-documents').getPublicUrl(backFileName);
    const { data: photoUrlData } = adminSupabase.storage.from('avatars').getPublicUrl(photoFileName);

    const frontUrl = frontUrlData?.publicUrl || `/uploads/${frontFileName}`;
    const backUrl = backUrlData?.publicUrl || `/uploads/${backFileName}`;
    const photoUrl = photoUrlData?.publicUrl || `/uploads/${photoFileName}`;

    // Metadata for admin authenticity inspection
    const frontMetadata = {
      size_bytes: frontFile.size,
      mime_type: frontFile.type,
      original_name: frontFile.name,
      uploaded_at: new Date().toISOString(),
    };

    const backMetadata = {
      size_bytes: backFile.size,
      mime_type: backFile.type,
      original_name: backFile.name,
      uploaded_at: new Date().toISOString(),
    };

    // Insert into driver_applications
    const { data: inserted, error: insertError } = await adminSupabase
      .from('driver_applications')
      .insert({
        full_name: validation.data.full_name,
        age: validation.data.age,
        phone: validation.data.phone,
        address: validation.data.address,
        vehicle_type: validation.data.vehicle_type,
        id_card_front_url: frontUrl,
        id_card_back_url: backUrl,
        personal_photo_url: photoUrl,
        id_card_front_metadata: frontMetadata,
        id_card_back_metadata: backMetadata,
        status: 'pending',
      } as never)
      .select('id')
      .single();

    if (insertError) {
      console.error('[DriverApplication] Insert error:', insertError);
      return { error: 'تعذر حفظ طلب الانضمام، حاول مرة أخرى' };
    }

    return {
      success: true,
      applicationId: (inserted as { id: string })?.id,
    };
  } catch (err) {
    console.error('[DriverApplication] Unexpected error:', err);
    return { error: 'حدث خطأ غير متوقع أثناء معالجة الطلب' };
  }
}

/**
 * Fetch all driver applications for Admin review.
 */
export async function getAdminDriverApplications(statusFilter?: 'pending' | 'approved' | 'rejected') {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('غير مصرح');
  }

  const supabase = await createClient();
  let query = supabase
    .from('driver_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as any[];
}

/**
 * Admin approves a driver application:
 * 1. Creates/activates Auth user with phone login
 * 2. Creates driver profile in drivers table
 * 3. Updates application status to approved
 * 4. Returns credentials and pre-built WhatsApp dispatch link
 */
export async function approveDriverApplicationAction(
  applicationId: string,
  customPassword?: string
): Promise<DriverApprovalResult> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== 'admin') {
    return { error: 'غير مصرح لك بتنفيذ هذا الإجراء' };
  }

  try {
    const adminSupabase = await createAdminClient();

    // 1. Get Application
    const { data: appData, error: appError } = await adminSupabase
      .from('driver_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !appData) {
      return { error: 'طلب الانضمام غير موجود' };
    }

    const app = appData as any;
    if (app.status === 'approved') {
      return { error: 'تمت الموافقة على هذا الطلب مسبقاً' };
    }

    // Generated temporary password (or admin custom password)
    const tempPassword = customPassword?.trim() || `Engz@${Math.floor(1000 + Math.random() * 9000)}`;
    const driverEmail = `${app.phone}@driver.engz.app`;

    // 2. Check if auth user exists, or create new user
    let authUserId: string = '';

    // First check if user already exists in public.users or auth
    const { data: existingUser } = await adminSupabase
      .from('users')
      .select('id, email, phone')
      .or(`phone.eq.${app.phone},email.eq.${driverEmail}`)
      .maybeSingle();

    const existingId = (existingUser as any)?.id;
    if (existingId) {
      authUserId = existingId;
      // Update existing auth user password & metadata
      try {
        await adminSupabase.auth.admin.updateUserById(authUserId, {
          password: tempPassword,
          email: driverEmail,
          email_confirm: true,
          user_metadata: { role: 'driver', full_name: app.full_name, phone: app.phone },
        });
      } catch (e) {
        console.warn('[ApproveDriver] updateUserById warning:', e);
      }
    } else {
      // Try creating via Admin API
      const { data: createdAuth, error: createAuthError } = await adminSupabase.auth.admin.createUser({
        email: driverEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: app.full_name,
          phone: app.phone,
          role: 'driver',
        },
      });

      if (createAuthError) {
        console.warn('[ApproveDriver] createUser error:', createAuthError.message);
        
        // Search in Supabase Auth user list to recover user id
        try {
          const { data: authList } = await adminSupabase.auth.admin.listUsers({ page: 1, perPage: 100 });
          const matched = authList?.users?.find(
            (u) => u.email === driverEmail || u.phone === app.phone || (u.user_metadata as any)?.phone === app.phone
          );
          if (matched) {
            authUserId = matched.id;
            await adminSupabase.auth.admin.updateUserById(authUserId, {
              password: tempPassword,
              user_metadata: { role: 'driver', full_name: app.full_name, phone: app.phone },
            });
          }
        } catch (recoverErr) {
          console.error('[ApproveDriver] Recovery error:', recoverErr);
        }

        if (!authUserId) {
          return { error: `فشل إنشاء حساب الطيار: ${createAuthError.message}` };
        }
      } else {
        authUserId = createdAuth.user.id;
      }
    }

    // 3. Upsert user in public.users
    await adminSupabase.from('users').upsert({
      id: authUserId,
      email: driverEmail,
      full_name: app.full_name,
      phone: app.phone,
      role: 'driver',
      is_active: true,
      avatar_url: app.personal_photo_url || '',
    } as any);

    // 4. Create row in drivers table if not already created
    const { data: existingDriver } = await adminSupabase
      .from('drivers')
      .select('id')
      .eq('user_id', authUserId)
      .maybeSingle();

    if (!existingDriver) {
      await adminSupabase.from('drivers').insert({
        user_id: authUserId,
        status: 'offline',
        is_blocked: false,
        commission_balance: 0,
        total_completed_orders: 0,
        is_active: true,
      } as never);
    } else {
      await adminSupabase
        .from('drivers')
        .update({ is_active: true, is_blocked: false } as never)
        .eq('user_id', authUserId);
    }

    // 5. Mark application as approved
    await adminSupabase
      .from('driver_applications')
      .update({
        status: 'approved',
        reviewed_by: admin.id,
        created_user_id: authUserId,
        reviewed_at: new Date().toISOString(),
      } as never)
      .eq('id', applicationId);

    // 6. Generate WhatsApp dispatch message
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://engz.app';
    const driverLoginUrl = `${appBaseUrl}/driver/login`;

    const whatsappMessage = `مرحباً بك يا كابتن ${app.full_name} في فريق طيارين إنجز! 🛵🎉

تمت مراجعة بياناتك واعتماد حسابك بنجاح. يمكنك الآن الدخول على لوحة تحكم الطيار واستقبال الطلبات فوراً:

🌐 رابط لوحة الطيار:
${driverLoginUrl}

📱 رقم الدخول (الهاتف): ${app.phone}
🔑 كلمة المرور المؤقتة: ${tempPassword}

💡 ملاحظة: يُرجى تغيير كلمة المرور بعد أول تسجيل دخول من صفحة ملفك الشخصي.

نتمنى لك رحلات توصيل موفقة وأرباحاً ممتازة مع إنجز! ✨`;

    // Egyptian WhatsApp number format (replace leading 0 with 20)
    const formattedPhone = app.phone.startsWith('0') ? `2${app.phone}` : app.phone;
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappMessage)}`;

    revalidatePath('/admin/drivers');
    revalidatePath('/admin/driver-applications');

    return {
      success: true,
      driverPhone: app.phone,
      driverName: app.full_name,
      tempPassword,
      whatsappUrl,
    };
  } catch (err: any) {
    console.error('[DriverApproval] Exception:', err);
    return { error: err?.message || 'حدث خطأ أثناء اعتماد الحساب' };
  }
}

/**
 * Admin rejects a driver application with optional reason.
 */
export async function rejectDriverApplicationAction(
  applicationId: string,
  reason: string
) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== 'admin') {
    return { error: 'غير مصرح' };
  }

  const adminSupabase = await createAdminClient();

  const { error } = await adminSupabase
    .from('driver_applications')
    .update({
      status: 'rejected',
      rejection_reason: reason || 'لم تستوفِ الأوراق الشروط المطلوبة',
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    } as never)
    .eq('id', applicationId);

  if (error) {
    return { error: 'تعذر تحديث حالة الطلب' };
  }

  revalidatePath('/admin/drivers');
  revalidatePath('/admin/driver-applications');
  return { success: true };
}
