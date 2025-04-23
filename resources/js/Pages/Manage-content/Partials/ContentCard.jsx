export default function ContentCard({ content, onEdit, onDelete }) {
    return (
        <div className="overflow-hidden bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-300">
            {content.image ? (
                <img src={content.image} alt="Content Thumbnail" className="w-full h-40 object-cover" />
            ): (
                <div className="w-full h-40 bg-gray-300"></div>
            )}
            <div className="p-4">
                <h3 className="text-lg font-semibold overflow-y-auto text-gray-800 h-16">{content.title}</h3>
               <p className="mt-2 text-sm h-40 overflow-y-auto p-1 text-gray-600">{content.description}</p>
                {/* Hashtags Section */}
                <div className="mt-2 ">
                    <p className="text-sm text-blue-600">{content.hashtags}</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">Published: {content.publish_date}</span>
                    <div className="flex gap-2">
                        <button
                            onClick={onEdit}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
                        >
                            Edit
                        </button>
                        <button
                            onClick={onDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}