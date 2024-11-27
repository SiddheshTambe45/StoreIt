import ActionsDropDown from '@/components/ActionsDropDown';
import Chart from '@/components/Chart';
import FormattedDateTime from '@/components/FormattedDateTime';
import Thumbnail from '@/components/Thumbnail';
import { Separator } from '@/components/ui/separator';
import { getFiles, getTotalSpaceUsed } from '@/lib/actions/file.actions';
import { getCurrentUser } from '@/lib/actions/user.actions';
import { convertFileSize, getUsageSummary } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Models } from 'node-appwrite';

const Dashboard = async () => {
    const currentUser = await getCurrentUser();

    // If the user is not authenticated, early return and don't load the rest of the data
    if (typeof window === 'undefined' && !currentUser) {
        console.log('are bhau 2222');
        // This will redirect the user to the sign-in page
        redirect('/sign-in');
        return null; // Return null to stop rendering the dashboard
    }

    const [files, totalSpaceUsed] = await Promise.all([
        getFiles({ types: [], limit: 10 }),
        getTotalSpaceUsed(),
    ]);

    const usageSummary = getUsageSummary(totalSpaceUsed);

    return (
        <div className="dashboard-container">
            <section>
                <Chart used={totalSpaceUsed.used} />

                <ul className="dashboard-summary-list">
                    {usageSummary.map((summary) => (
                        <Link
                            href={summary.url}
                            key={summary.title}
                            className="dashboard-summary-card"
                        >
                            <div className="space-y-4">
                                <div className="flex justify-between gap-3">
                                    <Image
                                        src={summary.icon}
                                        width={100}
                                        height={100}
                                        alt={summary.title}
                                        className="summary-type-icon"
                                    />
                                    <h4 className="summary-type-size">
                                        {convertFileSize(summary.size) || 0}
                                    </h4>
                                </div>

                                <h5 className="summary-type-title">
                                    {summary.title}
                                </h5>
                                <Separator className="bg-light-400" />

                                <FormattedDateTime
                                    date={summary.latestDate}
                                    className="text-center"
                                />
                            </div>
                        </Link>
                    ))}
                </ul>
            </section>

            <section className="dashboard-recent-files">
                <h2 className="h3 xl:h2 text-light-100">Recent file uploads</h2>

                {files.documents.length > 0 ? (
                    <ul className="mt-5 flex flex-col gap-5">
                        {files.documents.map((file: Models.Document) => (
                            <Link
                                href={file.url}
                                target="_blank"
                                className="flex items-center gap-3"
                                key={file.$id}
                            >
                                <Thumbnail
                                    type={file.type}
                                    extension={file.extension}
                                    url={file.url}
                                />
                                <div className="recent-file-details">
                                    <div className="flex flex-col gap-1">
                                        <p className="recent-file-name">
                                            {file.name}
                                        </p>
                                        <FormattedDateTime
                                            date={file.$createdAt}
                                            className="caption"
                                        />
                                    </div>
                                    <ActionsDropDown
                                        file={file}
                                        currentUser={currentUser}
                                    />
                                </div>
                            </Link>
                        ))}
                    </ul>
                ) : (
                    <p className="empty-list">No files uploaded </p>
                )}
            </section>
        </div>
    );
};

export default Dashboard;
