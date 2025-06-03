import { useEffect } from 'react'; // Importa useEffect
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    image: z.instanceof(FileList).optional(),
    hashtags: z.string().min(1, 'Hashtags are required'),
});

export default function EditCampaignModal({ isOpen, onClose, onSubmit, campaign }) {
    const { register, handleSubmit, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
    });

    // Precarga los valores del formulario cuando cambia la campaña
    useEffect(() => {
        if (campaign) {
            setValue('title', campaign.title);
            setValue('description', campaign.description);
            setValue('hashtags', campaign.hashtags);
        }
    }, [campaign, setValue]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Edit Campaign</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Title */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            {...register('title')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            {...register('description')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="3"
                        ></textarea>
                        {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
                    </div>

                    {/* Image */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Image</label>
                        <input
                            type="file"
                            {...register('image')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            accept="image/*"
                        />
                        {errors.image && <p className="text-sm text-red-600">{errors.image.message}</p>}
                    </div>

                    {/* Hashtags */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700">Hashtags</label>
                        <input
                            {...register('hashtags')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="#example #hashtags"
                        />
                        {errors.hashtags && <p className="text-sm text-red-600">{errors.hashtags.message}</p>}
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-300 mr-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}